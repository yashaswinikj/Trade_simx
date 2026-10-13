import time
import logging
from database.mongo_client import db_manager

logger = logging.getLogger("TradeSimX.PaperTrading")

class PaperTradingService:
    def __init__(self):
        self.accounts_coll = db_manager.get_collection("paper_accounts")
        self.positions_coll = db_manager.get_collection("paper_positions")
        self.trades_coll = db_manager.get_collection("paper_trades")

    def get_or_create_account(self, user_id):
        user_id = user_id or "demo_user"
        acc = self.accounts_coll.find_one({"user_id": user_id})
        if not acc:
            acc = {
                "id": f"paper_{user_id}",
                "user_id": user_id,
                "initial_capital": 100000.0,
                "cash_balance": 100000.0,
                "realized_pnl": 0.0,
                "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
            }
            self.accounts_coll.insert_one(acc)
        return acc

    def get_account_summary(self, user_id):
        user_id = user_id or "demo_user"
        acc = self.get_or_create_account(user_id)
        positions = self.positions_coll.find_all({"user_id": user_id})
        trades = self.trades_coll.find_all({"user_id": user_id})

        from services.data_service import data_service

        open_positions = []
        total_position_value = 0.0
        unrealized_total_pnl = 0.0

        for pos in positions:
            sym = pos.get("symbol", "BTC-USD")
            amt = float(pos.get("amount", 0.0))
            entry_price = float(pos.get("entry_price", 0.0))

            try:
                ohlcv = data_service.load_ohlcv(symbol=sym, limit=1)
                curr_price = float(ohlcv.iloc[-1]["close"]) if len(ohlcv) > 0 else entry_price
            except Exception:
                curr_price = entry_price

            curr_val = amt * curr_price
            cost_basis = amt * entry_price
            unrealized_pnl = curr_val - cost_basis
            unrealized_pct = (unrealized_pnl / cost_basis * 100.0) if cost_basis > 0 else 0.0

            total_position_value += curr_val
            unrealized_total_pnl += unrealized_pnl

            open_positions.append({
                "id": pos.get("id"),
                "symbol": sym,
                "type": pos.get("side", "BUY"),
                "amount": amt,
                "entry_price": round(entry_price, 2),
                "current_price": round(curr_price, 2),
                "unrealized_pnl": round(unrealized_pnl, 2),
                "unrealized_pnl_pct": round(unrealized_pct, 2),
                "opened_at": pos.get("opened_at")
            })

        total_equity = float(acc["cash_balance"]) + total_position_value
        initial_cap = float(acc["initial_capital"])
        net_return_pct = round(((total_equity - initial_cap) / initial_cap) * 100.0, 2)

        return {
            "user_id": user_id,
            "initial_capital": initial_cap,
            "cash_balance": round(float(acc["cash_balance"]), 2),
            "total_equity": round(total_equity, 2),
            "realized_pnl": round(float(acc["realized_pnl"]), 2),
            "unrealized_pnl": round(unrealized_total_pnl, 2),
            "net_return_pct": net_return_pct,
            "open_positions": open_positions,
            "recent_trades": trades[-20:] if trades else []
        }

    def execute_buy(self, user_id, symbol="BTC-USD", amount=0.1, price=94580.0):
        user_id = user_id or "demo_user"
        amount = float(amount)
        price = float(price)

        if amount <= 0 or price <= 0:
            raise ValueError("Quantity and price must be greater than zero.")

        acc = self.get_or_create_account(user_id)
        order_cost = amount * price
        cash_balance = float(acc["cash_balance"])

        if cash_balance < order_cost:
            raise ValueError("Insufficient virtual balance for this order.")

        new_cash = cash_balance - order_cost

        # Update or Create Position
        existing_pos = self.positions_coll.find_one({"user_id": user_id, "symbol": symbol})
        if existing_pos:
            old_amt = float(existing_pos["amount"])
            old_entry = float(existing_pos["entry_price"])
            new_amt = old_amt + amount
            new_entry = ((old_amt * old_entry) + (amount * price)) / new_amt
            self.positions_coll.delete_one({"user_id": user_id, "symbol": symbol})
            self.positions_coll.insert_one({
                "id": existing_pos["id"],
                "user_id": user_id,
                "symbol": symbol,
                "side": "BUY",
                "amount": new_amt,
                "entry_price": new_entry,
                "opened_at": existing_pos.get("opened_at", time.strftime("%Y-%m-%dT%H:%M:%SZ"))
            })
        else:
            self.positions_coll.insert_one({
                "id": f"pos_{user_id}_{int(time.time())}",
                "user_id": user_id,
                "symbol": symbol,
                "side": "BUY",
                "amount": amount,
                "entry_price": price,
                "opened_at": time.strftime("%Y-%m-%dT%H:%M:%SZ")
            })

        # Update Account Cash
        self.accounts_coll.update_one(
            {"user_id": user_id},
            {"$set": {"cash_balance": new_cash}}
        )

        # Log Trade Transaction
        trade_doc = {
            "id": f"trade_{user_id}_{int(time.time())}",
            "user_id": user_id,
            "symbol": symbol,
            "side": "BUY",
            "amount": amount,
            "price": price,
            "order_value": round(order_cost, 2),
            "realized_pnl": 0.0,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        self.trades_coll.insert_one(trade_doc)

        return {"success": True, "trade": trade_doc, "message": f"Paper BUY executed: {amount} {symbol} @ ${price:,.2f}"}

    def execute_sell(self, user_id, symbol="BTC-USD", amount=0.1, price=94580.0):
        user_id = user_id or "demo_user"
        amount = float(amount)
        price = float(price)

        if amount <= 0 or price <= 0:
            raise ValueError("Quantity and price must be greater than zero.")

        acc = self.get_or_create_account(user_id)
        existing_pos = self.positions_coll.find_one({"user_id": user_id, "symbol": symbol})

        if not existing_pos or float(existing_pos["amount"]) < amount:
            raise ValueError("Insufficient holdings to complete this sale.")

        old_amt = float(existing_pos["amount"])
        entry_price = float(existing_pos["entry_price"])

        sale_proceeds = amount * price
        cost_basis = amount * entry_price
        trade_realized_pnl = sale_proceeds - cost_basis

        new_cash = float(acc["cash_balance"]) + sale_proceeds
        new_realized_pnl = float(acc["realized_pnl"]) + trade_realized_pnl

        # Update Position
        remaining_amt = old_amt - amount
        self.positions_coll.delete_one({"user_id": user_id, "symbol": symbol})
        if remaining_amt > 1e-6:
            self.positions_coll.insert_one({
                "id": existing_pos["id"],
                "user_id": user_id,
                "symbol": symbol,
                "side": "BUY",
                "amount": remaining_amt,
                "entry_price": entry_price,
                "opened_at": existing_pos.get("opened_at")
            })

        # Update Account Cash & Realized PnL
        self.accounts_coll.update_one(
            {"user_id": user_id},
            {"$set": {"cash_balance": new_cash, "realized_pnl": new_realized_pnl}}
        )

        # Log Trade Transaction
        trade_doc = {
            "id": f"trade_{user_id}_{int(time.time())}",
            "user_id": user_id,
            "symbol": symbol,
            "side": "SELL",
            "amount": amount,
            "price": price,
            "order_value": round(sale_proceeds, 2),
            "realized_pnl": round(trade_realized_pnl, 2),
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
        }
        self.trades_coll.insert_one(trade_doc)

        return {"success": True, "trade": trade_doc, "message": f"Paper SELL executed: {amount} {symbol} @ ${price:,.2f} (P&L: ${trade_realized_pnl:+.2f})"}

paper_trading_service = PaperTradingService()
