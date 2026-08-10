import io
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from app.db.database import get_db_connection
import json

class PDFService:
    def generate_report(self, payload: dict) -> io.BytesIO:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = styles['Title']
        heading_style = styles['Heading2']
        normal_style = styles['Normal']
        
        custom_heading = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            textColor=colors.HexColor('#0f172a'),
            spaceBefore=20,
            spaceAfter=10
        )
        
        elements = []
        
        # 1. Header
        elements.append(Paragraph("<b>SUPPLYPRESCRIPT</b>", title_style))
        elements.append(Paragraph("Closed-Loop Prescriptive Analytics", styles['Heading3']))
        elements.append(Spacer(1, 20))
        elements.append(Paragraph("<b>Executive Report</b>", heading_style))
        
        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        elements.append(Paragraph(f"<b>Report Date:</b> {current_time}", normal_style))
        elements.append(Paragraph(f"<b>Matching Records:</b> {payload.get('records_count', 0)}", normal_style))
        elements.append(Spacer(1, 20))
        
        # 2. Executive Summary
        elements.append(Paragraph("<b>EXECUTIVE SUMMARY</b>", custom_heading))
        kpis = payload.get('kpis', {})
        summary_text = (f"This report reflects the current operational state based on {payload.get('records_count', 0)} filtered records. "
                        f"The current on-time delivery rate is {kpis.get('On-Time Rate', 'N/A')}, with an average delay of {kpis.get('Average Delay', 'N/A')}. "
                        f"There are currently {kpis.get('Delayed Deliveries', '0')} delayed deliveries and {kpis.get('High-Risk Routes', '0')} high-risk routes identified, "
                        f"resulting in a projected cost impact of {kpis.get('Cost Impact', '$0')}.")
        elements.append(Paragraph(summary_text, normal_style))
        elements.append(Spacer(1, 20))
        
        # 3. Active Filters
        elements.append(Paragraph("<b>ACTIVE FILTERS</b>", custom_heading))
        filters = payload.get('filters', [])
        if not filters:
            elements.append(Paragraph("All Records (No filters applied)", normal_style))
        else:
            for f in filters:
                elements.append(Paragraph(f"• {f}", normal_style))
        elements.append(Spacer(1, 20))
        
        # 4. KPI Summary Table
        elements.append(Paragraph("<b>KPI SUMMARY</b>", custom_heading))
        kpi_data = [["KPI", "Value"]]
        for k, v in kpis.items():
            kpi_data.append([k, str(v)])
            
        t = Table(kpi_data, colWidths=[200, 200])
        t.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f172a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e2e8f0')),
        ]))
        elements.append(t)
        elements.append(Spacer(1, 30))
        
        # Fetch current workflow state directly from DB
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM workflow_states ORDER BY id DESC LIMIT 1")
            row = cursor.fetchone()
            
        if row:
            state = dict(row)
            
            # 5. Closed-Loop Process
            elements.append(Paragraph("<b>CLOSED-LOOP PROCESS STATUS</b>", custom_heading))
            stages = [
                ("Prediction", state.get('prediction_status')),
                ("Optimization", state.get('optimization_status')),
                ("Decision", state.get('decision_status')),
                ("Execution", state.get('execution_status')),
                ("Outcome", state.get('outcome_status')),
                ("Model Learning", state.get('learning_status'))
            ]
            
            for stage, status in stages:
                if status == 'COMPLETED':
                    icon = "✓"
                    color = colors.green
                elif status == 'FAILED':
                    icon = "✗"
                    color = colors.red
                else:
                    icon = "○"
                    color = colors.gray
                elements.append(Paragraph(f"<font color={color}>{icon}</font> {stage}: {status}", normal_style))
            
            elements.append(Spacer(1, 20))
            
            # 6. Optimization Section & Audit
            if state.get('optimization_status') in ['COMPLETED', 'FAILED']:
                elements.append(Paragraph("<b>OPTIMIZATION ANALYSIS</b>", custom_heading))
                elements.append(Paragraph(f"<b>Solver:</b> SciPy", normal_style))
                elements.append(Paragraph(f"<b>Solver Status:</b> {'OPTIMAL' if state['optimization_status'] == 'COMPLETED' else 'FAILED'}", normal_style))
                elements.append(Paragraph(f"<b>Feasibility Status:</b> {'PASSED' if state['optimization_status'] == 'COMPLETED' else 'VIOLATED'}", normal_style))
                if state.get('expected_cost'):
                    elements.append(Paragraph(f"<b>Optimized Cost:</b> ${state['expected_cost']:,.2f}", normal_style))
                
                elements.append(Spacer(1, 10))
                elements.append(Paragraph("<b>Optimization Audit</b>", styles['Heading4']))
                audit_json = state.get('optimization_audit_json')
                if audit_json:
                    try:
                        audit_data = json.loads(audit_json)
                        audit_table_data = [["Constraint", "Actual Value", "Limit", "Status"]]
                        for k, v in audit_data.items():
                            status_text = "✓ PASSED" if v.get('passed') else "✗ FAILED"
                            audit_table_data.append([k, str(v.get('actual')), str(v.get('limit')), status_text])
                        
                        at = Table(audit_table_data, colWidths=[120, 100, 100, 100])
                        at.setStyle(TableStyle([
                            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#334155')),
                            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
                            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                        ]))
                        elements.append(at)
                    except Exception as e:
                        elements.append(Paragraph("Could not parse audit data.", normal_style))
            
            elements.append(Spacer(1, 20))
            
            # 7. Decision Execution
            elements.append(Paragraph("<b>DECISION EXECUTION</b>", custom_heading))
            if state.get('execution_status') in ['COMPLETED', 'FAILED']:
                elements.append(Paragraph(f"<b>Decision ID:</b> {state.get('decision_id') or 'N/A'}", normal_style))
                elements.append(Paragraph(f"<b>Option:</b> {state.get('selected_option') or 'N/A'}", normal_style))
                
                exp_c = state.get('expected_cost') or 0
                exp_d = state.get('expected_delay') or 0
                
                elements.append(Paragraph(f"<b>Expected Cost:</b> ${exp_c:,.2f}", normal_style))
                elements.append(Paragraph(f"<b>Expected Delay:</b> {exp_d} hrs", normal_style))
                elements.append(Paragraph(f"<b>Execution Status:</b> {state.get('execution_status')}", normal_style))
                db_status = "SUCCESS" if state.get('execution_status') == 'COMPLETED' else "FAILED"
                elements.append(Paragraph(f"<b>Database Write-Back:</b> {db_status}", normal_style))
            else:
                elements.append(Paragraph("No decision executed yet.", normal_style))
                
            elements.append(Spacer(1, 20))
            
            # 8. Outcome Analysis
            elements.append(Paragraph("<b>OUTCOME ANALYSIS</b>", custom_heading))
            if state.get('outcome_status') == 'COMPLETED':
                exp_cost = state.get('expected_cost') or 0
                act_cost = state.get('actual_cost') or 0
                cost_var = act_cost - exp_cost
                
                exp_delay = state.get('expected_delay') or 0
                act_delay = state.get('actual_delay') or 0
                delay_var = act_delay - exp_delay
                
                elements.append(Paragraph(f"<b>Predicted Cost:</b> ${exp_cost:,.2f}", normal_style))
                elements.append(Paragraph(f"<b>Actual Cost:</b> ${act_cost:,.2f}", normal_style))
                elements.append(Paragraph(f"<b>Cost Variance:</b> {'+' if cost_var > 0 else ''}${cost_var:,.2f}", normal_style))
                elements.append(Spacer(1, 5))
                elements.append(Paragraph(f"<b>Predicted Delay:</b> {exp_delay} hrs", normal_style))
                elements.append(Paragraph(f"<b>Actual Delay:</b> {act_delay} hrs", normal_style))
                elements.append(Paragraph(f"<b>Delay Variance:</b> {'+' if delay_var > 0 else ''}{delay_var} hrs", normal_style))
                elements.append(Spacer(1, 5))
                elements.append(Paragraph(f"<b>Outcome Status:</b> COMPLETED", normal_style))
            else:
                elements.append(Paragraph("Outcome evaluation pending.", normal_style))
        
        doc.build(elements)
        buffer.seek(0)
        return buffer

pdf_service = PDFService()
