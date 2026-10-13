import os
import logging
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from config import Config

logger = logging.getLogger("TradeSimX.ReportService")

class ReportService:
    """
    Generates downloadable publication-grade PDF Quantitative Performance Reports.
    """

    @staticmethod
    def generate_pdf_report(backtest_data, strategy_name="Custom Strategy", symbol="BTC-USD"):
        """
        Generates PDF document from backtest execution result and saves to reports directory.
        """
        try:
            report_id = backtest_data.get("id", datetime.now().strftime("%Y%m%d_%H%M%S"))
            filename = f"tradesimx_report_{report_id}.pdf"
            filepath = os.path.join(Config.REPORTS_DIR, filename)

            metrics = backtest_data.get("metrics", {})
            trades = backtest_data.get("trades", [])

            doc = SimpleDocTemplate(
                filepath,
                pagesize=letter,
                rightMargin=36,
                leftMargin=36,
                topMargin=36,
                bottomMargin=36
            )

            styles = getSampleStyleSheet()

            # Custom styles
            title_style = ParagraphStyle(
                'DocTitle',
                parent=styles['Heading1'],
                fontName='Helvetica-Bold',
                fontSize=22,
                textColor=colors.HexColor('#0F172A'),
                spaceAfter=6
            )

            subtitle_style = ParagraphStyle(
                'DocSubtitle',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=11,
                textColor=colors.HexColor('#64748B'),
                spaceAfter=15
            )

            h2_style = ParagraphStyle(
                'SectionHeading',
                parent=styles['Heading2'],
                fontName='Helvetica-Bold',
                fontSize=14,
                textColor=colors.HexColor('#1E293B'),
                spaceBefore=15,
                spaceAfter=8
            )

            body_style = ParagraphStyle(
                'BodyTextCustom',
                parent=styles['Normal'],
                fontName='Helvetica',
                fontSize=10,
                textColor=colors.HexColor('#334155'),
                spaceAfter=6
            )

            elements = []

            # Header
            elements.append(Paragraph("TradeSimX AI - Quantitative Performance Report", title_style))
            elements.append(Paragraph(f"Generated on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} | Asset: <b>{symbol}</b> | Strategy: <b>{strategy_name}</b>", subtitle_style))
            elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#3B82F6'), spaceAfter=15))

            # Performance Metrics Grid Table
            elements.append(Paragraph("Key Performance Metrics", h2_style))

            net_pnl = metrics.get("net_profit", 0.0)
            net_pnl_color = colors.HexColor('#16A34A') if net_pnl >= 0 else colors.HexColor('#DC2626')

            metrics_table_data = [
                [
                    Paragraph("<b>Initial Capital:</b>", body_style), Paragraph(f"${metrics.get('initial_capital', 10000):,.2f}", body_style),
                    Paragraph("<b>Final Equity:</b>", body_style), Paragraph(f"${metrics.get('final_equity', 10000):,.2f}", body_style)
                ],
                [
                    Paragraph("<b>Net Profit:</b>", body_style), Paragraph(f"<font color='{net_pnl_color.hexval()}'>${net_pnl:,.2f} ({metrics.get('net_profit_pct', 0.0):+.2f}%)</font>", body_style),
                    Paragraph("<b>Benchmark Return:</b>", body_style), Paragraph(f"{metrics.get('benchmark_return_pct', 0.0):+.2f}%", body_style)
                ],
                [
                    Paragraph("<b>Sharpe Ratio:</b>", body_style), Paragraph(f"{metrics.get('sharpe_ratio', 0.0):.2f}", body_style),
                    Paragraph("<b>Sortino Ratio:</b>", body_style), Paragraph(f"{metrics.get('sortino_ratio', 0.0):.2f}", body_style)
                ],
                [
                    Paragraph("<b>Max Drawdown:</b>", body_style), Paragraph(f"<font color='#DC2626'>{metrics.get('max_drawdown_pct', 0.0):.2f}%</font>", body_style),
                    Paragraph("<b>Win Rate:</b>", body_style), Paragraph(f"{metrics.get('win_rate', 0.0):.1f}% ({metrics.get('winning_trades', 0)} / {metrics.get('total_trades', 0)})", body_style)
                ],
                [
                    Paragraph("<b>Profit Factor:</b>", body_style), Paragraph(f"{metrics.get('profit_factor', 0.0):.2f}", body_style),
                    Paragraph("<b>Expectancy:</b>", body_style), Paragraph(f"${metrics.get('expectancy', 0.0):,.2f}", body_style)
                ]
            ]

            t_metrics = Table(metrics_table_data, colWidths=[110, 150, 110, 150])
            t_metrics.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F8FAFC')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                ('PADDING', (0,0), (-1,-1), 6),
            ]))
            elements.append(t_metrics)
            elements.append(Spacer(1, 15))

            # Executed Trades Table (Recent 15 Trades)
            elements.append(Paragraph("Recent Executed Trade Log", h2_style))

            trade_table_data = [[
                Paragraph("<b>#</b>", body_style),
                Paragraph("<b>Entry Time</b>", body_style),
                Paragraph("<b>Exit Time</b>", body_style),
                Paragraph("<b>Entry Price</b>", body_style),
                Paragraph("<b>Exit Price</b>", body_style),
                Paragraph("<b>PnL ($)</b>", body_style),
                Paragraph("<b>Reason</b>", body_style)
            ]]

            recent_trades = trades[-15:] if trades else []
            for t in recent_trades:
                pnl_val = t.get("pnl", 0.0)
                pnl_col = "#16A34A" if pnl_val >= 0 else "#DC2626"
                trade_table_data.append([
                    Paragraph(str(t.get("id", "")), body_style),
                    Paragraph(str(t.get("entry_time", "")), body_style),
                    Paragraph(str(t.get("exit_time", "")), body_style),
                    Paragraph(f"${t.get('entry_price', 0):,.2f}", body_style),
                    Paragraph(f"${t.get('exit_price', 0):,.2f}", body_style),
                    Paragraph(f"<font color='{pnl_col}'>${pnl_val:+.2f} ({t.get('pnl_pct', 0):+.1f}%)</font>", body_style),
                    Paragraph(str(t.get("exit_reason", "")), body_style)
                ])

            if len(trade_table_data) == 1:
                trade_table_data.append([Paragraph("No trades executed during backtest period.", body_style)] + [Paragraph("", body_style)]*6)

            t_trades = Table(trade_table_data, colWidths=[25, 100, 100, 70, 70, 85, 70])
            t_trades.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#0F172A')),
                ('TEXTCOLOR', (0,0), (-1,0), colors.white),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#CBD5E1')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E2E8F0')),
                ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, colors.HexColor('#F8FAFC')]),
                ('PADDING', (0,0), (-1,-1), 5),
            ]))
            elements.append(t_trades)
            elements.append(Spacer(1, 20))

            # Footer Disclaimer
            elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#94A3B8'), spaceBefore=10, spaceAfter=10))
            elements.append(Paragraph("<font size=8 color='#64748B'><b>Risk Disclaimer:</b> TradeSimX AI backtesting reports are generated for analytical and simulation purposes only. Past performance does not guarantee future results. Cryptocurrency trading involves substantial financial risk.</font>", body_style))

            doc.build(elements)
            logger.info(f"Generated PDF report successfully: {filepath}")
            return filepath, filename
        except Exception as e:
            logger.error(f"Error generating PDF report: {e}")
            raise e
