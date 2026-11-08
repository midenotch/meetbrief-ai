import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_presentation(output_path="MeetBrief_AI_Hackathon_Pitch_Deck.pptx"):
    prs = Presentation()
    # 16:9 Widescreen dimensions
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Palette - Modern Dark Executive Theme
    BG_COLOR = RGBColor(11, 15, 25)          # #0B0F19 - Deep Void Navy
    CARD_BG = RGBColor(22, 30, 49)           # #161E31 - Sleek Card Dark Slate
    CARD_BORDER = RGBColor(38, 50, 79)       # #26324F - Subtle Border
    TEXT_WHITE = RGBColor(255, 255, 255)     # #FFFFFF - Pure White
    TEXT_MUTED = RGBColor(148, 163, 184)     # #94A3B8 - Slate Muted
    TEXT_DIM = RGBColor(100, 116, 139)       # #64748B - Dim Muted
    
    # Accent Colors
    ACCENT_CYAN = RGBColor(6, 182, 212)      # #06B6D4 - Primary Cyan
    ACCENT_EMERALD = RGBColor(16, 185, 129)  # #10B981 - Success Emerald
    ACCENT_PURPLE = RGBColor(168, 85, 247)   # #A855F7 - AI Violet
    ACCENT_AMBER = RGBColor(245, 158, 11)    # #F59E0B - Warning/Highlight Amber
    ACCENT_RED = RGBColor(239, 68, 68)       # #EF4444 - Problem Red

    blank_layout = prs.slide_layouts[6]  # Blank slide

    def set_slide_background(slide):
        bg = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height
        )
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_COLOR
        bg.line.fill.background()
        return bg

    def add_header(slide, category_tag, title_text, subtitle_text=None):
        # Category Tag
        tag_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(11), Inches(0.4))
        tf_tag = tag_box.text_frame
        tf_tag.word_wrap = True
        tf_tag.margin_left = tf_tag.margin_top = tf_tag.margin_right = tf_tag.margin_bottom = 0
        p_tag = tf_tag.paragraphs[0]
        p_tag.text = category_tag.upper()
        p_tag.font.size = Pt(11)
        p_tag.font.bold = True
        p_tag.font.color.rgb = ACCENT_CYAN

        # Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.7), Inches(0.7))
        tf_title = title_box.text_frame
        tf_title.word_wrap = True
        tf_title.margin_left = tf_title.margin_top = tf_title.margin_right = tf_title.margin_bottom = 0
        p_title = tf_title.paragraphs[0]
        p_title.text = title_text
        p_title.font.size = Pt(26)
        p_title.font.bold = True
        p_title.font.color.rgb = TEXT_WHITE

        if subtitle_text:
            p_sub = tf_title.add_paragraph()
            p_sub.text = subtitle_text
            p_sub.font.size = Pt(13)
            p_sub.font.color.rgb = TEXT_MUTED

    def add_card(slide, left, top, width, height, bg_color=CARD_BG, border_color=CARD_BORDER):
        card = slide.shapes.add_shape(
            MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height
        )
        card.fill.solid()
        card.fill.fore_color.rgb = bg_color
        card.line.color.rgb = border_color
        card.line.width = Pt(1.2)
        return card

    # =========================================================================
    # SLIDE 1: TITLE / COVER SLIDE
    # =========================================================================
    s1 = prs.slides.add_slide(blank_layout)
    set_slide_background(s1)

    # Decorative Gradient-like background cards
    add_card(s1, Inches(0.8), Inches(0.9), Inches(11.733), Inches(5.7), CARD_BG, CARD_BORDER)

    # Badge Pill
    badge = s1.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, Inches(1.3), Inches(1.3), Inches(3.6), Inches(0.4)
    )
    badge.fill.solid()
    badge.fill.fore_color.rgb = RGBColor(30, 41, 67)
    badge.line.color.rgb = ACCENT_CYAN
    badge.line.width = Pt(1)
    tf_b = badge.text_frame
    p_b = tf_b.paragraphs[0]
    p_b.text = "⚡ HACKATHON SHOWCASE SUBMISSION"
    p_b.font.size = Pt(10)
    p_b.font.bold = True
    p_b.font.color.rgb = ACCENT_CYAN
    p_b.alignment = PP_ALIGN.CENTER

    # Main Title
    t_box = s1.shapes.add_textbox(Inches(1.3), Inches(1.85), Inches(10.7), Inches(2.3))
    tf = t_box.text_frame
    tf.word_wrap = True
    p1 = tf.paragraphs[0]
    p1.text = "🎙️ MeetBrief AI"
    p1.font.size = Pt(46)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE

    p2 = tf.add_paragraph()
    p2.text = "The Autonomous End-to-End Meeting Lifecycle Companion"
    p2.font.size = Pt(22)
    p2.font.bold = True
    p2.font.color.rgb = ACCENT_CYAN

    p3 = tf.add_paragraph()
    p3.text = "Pre-Meeting Deep Web Research  •  Real-Time In-Meeting Transcription  •  Post-Meeting Intelligence Engine"
    p3.font.size = Pt(13)
    p3.font.color.rgb = TEXT_MUTED

    # 3 Pill Features at bottom of hero card
    pill_data = [
        ("🔍 Stage 1: Pre-Meeting", "30-Day autonomous corporate research dossier powered by Tavily & Claude/Gemini"),
        ("🎙️ Stage 2: In-Meeting", "Manifest V3 Chrome sidepanel with ambient Web Speech API live transcription"),
        ("🧠 Stage 3: Post-Meeting", "Anticipated vs. actual review, prioritized action items, and 1-click follow-up email")
    ]
    for i, (p_title, p_desc) in enumerate(pill_data):
        c_left = Inches(1.3 + i * 3.65)
        add_card(s1, c_left, Inches(4.3), Inches(3.45), Inches(1.5), RGBColor(16, 23, 38), CARD_BORDER)
        box = s1.shapes.add_textbox(c_left + Inches(0.15), Inches(4.4), Inches(3.15), Inches(1.3))
        tb = box.text_frame
        tb.word_wrap = True
        bp1 = tb.paragraphs[0]
        bp1.text = p_title
        bp1.font.size = Pt(13)
        bp1.font.bold = True
        bp1.font.color.rgb = TEXT_WHITE
        bp2 = tb.add_paragraph()
        bp2.text = p_desc
        bp2.font.size = Pt(10.5)
        bp2.font.color.rgb = TEXT_MUTED

    # Footer author info
    f_box = s1.shapes.add_textbox(Inches(1.3), Inches(6.05), Inches(10.7), Inches(0.4))
    tf_f = f_box.text_frame
    pf = tf_f.paragraphs[0]
    pf.text = "Built by midenotch (midenotch@gmail.com)  |  GitHub: github.com/midenotch/meetbrief-ai"
    pf.font.size = Pt(11)
    pf.font.color.rgb = TEXT_DIM

    # =========================================================================
    # SLIDE 2: THE PROBLEM
    # =========================================================================
    s2 = prs.slides.add_slide(blank_layout)
    set_slide_background(s2)
    add_header(s2, "The Problem", "The High Cost of Unprepared, Unassisted Meetings", "Knowledge workers attend 55M+ meetings daily, yet the workflow remains fragmented and manual.")

    problem_cards = [
        {
            "num": "01",
            "title": "Pre-Meeting Blindspots",
            "stat": "45+ Mins Wasted",
            "stat_label": "on frantic pre-call googling",
            "desc": "Founders, sales reps, and consultants scramble before calls, missing recent acquisitions, leadership hires, product launches, or funding announcements.",
            "color": ACCENT_RED
        },
        {
            "num": "02",
            "title": "Distracted Active Listening",
            "stat": "70% Cognitive Load",
            "stat_label": "lost to frantic manual note-taking",
            "desc": "Participants struggle between conversing and jotting down notes. Critical context is lost, verbal commitments are forgotten, and executive presence suffers.",
            "color": ACCENT_AMBER
        },
        {
            "num": "03",
            "title": "Broken Post-Call Follow-Through",
            "stat": "Hours Delayed",
            "stat_label": "drafting summaries and action emails",
            "desc": "Action items get buried in scribbled notes, deadlines are vague, questions remain unanswered, and follow-up emails take hours or are completely dropped.",
            "color": ACCENT_PURPLE
        }
    ]

    for i, item in enumerate(problem_cards):
        c_left = Inches(0.8 + i * 3.98)
        add_card(s2, c_left, Inches(1.8), Inches(3.75), Inches(5.0))
        
        box = s2.shapes.add_textbox(c_left + Inches(0.25), Inches(2.05), Inches(3.25), Inches(4.5))
        tf = box.text_frame
        tf.word_wrap = True
        
        p_num = tf.paragraphs[0]
        p_num.text = f"PAIN POINT {item['num']}"
        p_num.font.size = Pt(11)
        p_num.font.bold = True
        p_num.font.color.rgb = item['color']
        
        p_t = tf.add_paragraph()
        p_t.text = item['title']
        p_t.font.size = Pt(18)
        p_t.font.bold = True
        p_t.font.color.rgb = TEXT_WHITE
        
        p_st = tf.add_paragraph()
        p_st.text = item['stat']
        p_st.font.size = Pt(22)
        p_st.font.bold = True
        p_st.font.color.rgb = item['color']
        
        p_stl = tf.add_paragraph()
        p_stl.text = item['stat_label']
        p_stl.font.size = Pt(11)
        p_stl.font.color.rgb = TEXT_MUTED
        
        p_div = tf.add_paragraph()
        p_div.text = "—" * 16
        p_div.font.size = Pt(9)
        p_div.font.color.rgb = CARD_BORDER

        p_d = tf.add_paragraph()
        p_d.text = item['desc']
        p_d.font.size = Pt(12)
        p_d.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 3: THE SOLUTION OVERVIEW
    # =========================================================================
    s3 = prs.slides.add_slide(blank_layout)
    set_slide_background(s3)
    add_header(s3, "The Solution", "MeetBrief AI: The 360° Meeting Lifecycle Engine", "An integrated platform replacing 5 disconnected tools across every stage of the meeting.")

    solutions = [
        {
            "stage": "STAGE 1",
            "badge": "BEFORE THE CALL",
            "title": "Autonomous Web Dossier",
            "points": [
                "Scans last 30 days of target activity via Tavily",
                "5 critical axes: News, Funding, Product, Leadership, M&A",
                "Executive Snapshot with factual source citations",
                "Key stakeholder bios & background relevance",
                "Strategic discussion points, questions & risk radar"
            ],
            "accent": ACCENT_CYAN
        },
        {
            "stage": "STAGE 2",
            "badge": "DURING THE CALL",
            "title": "Ambient Chrome Companion",
            "points": [
                "Manifest V3 Chrome Extension sidepanel",
                "Auto-detects Google Meet, Zoom & Microsoft Teams",
                "Zero-lag live speech-to-text via Web Speech API",
                "Timestamped speaker segments & live duration",
                "AI-assisted transcript grammar & phonetic correction"
            ],
            "accent": ACCENT_EMERALD
        },
        {
            "stage": "STAGE 3",
            "badge": "AFTER THE CALL",
            "title": "Post-Meeting Intelligence",
            "points": [
                "Anticipated vs. Actual reality comparison",
                "Extracted key decisions with owners & rationale",
                "Prioritized action items (High/Med/Low) with deadlines",
                "Identified unresolved questions raised during the call",
                "Ready-to-send follow-up email with 1-click clipboard copy"
            ],
            "accent": ACCENT_PURPLE
        }
    ]

    for i, s in enumerate(solutions):
        c_left = Inches(0.8 + i * 3.98)
        card = add_card(s3, c_left, Inches(1.8), Inches(3.75), Inches(5.0))
        
        box = s3.shapes.add_textbox(c_left + Inches(0.25), Inches(2.05), Inches(3.25), Inches(4.5))
        tf = box.text_frame
        tf.word_wrap = True
        
        p_stg = tf.paragraphs[0]
        p_stg.text = f"{s['stage']} • {s['badge']}"
        p_stg.font.size = Pt(10)
        p_stg.font.bold = True
        p_stg.font.color.rgb = s['accent']
        
        p_tit = tf.add_paragraph()
        p_tit.text = s['title']
        p_tit.font.size = Pt(18)
        p_tit.font.bold = True
        p_tit.font.color.rgb = TEXT_WHITE
        
        tf.add_paragraph() # spacer
        
        for pt in s['points']:
            p_bullet = tf.add_paragraph()
            p_bullet.text = f"✓  {pt}"
            p_bullet.font.size = Pt(11.5)
            p_bullet.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 4: DEEP DIVE - PRE-MEETING RESEARCH
    # =========================================================================
    s4 = prs.slides.add_slide(blank_layout)
    set_slide_background(s4)
    add_header(s4, "Feature Deep Dive", "Stage 1: Autonomous Pre-Meeting Research Engine", "Turning raw internet noise into a dense, verified intelligence briefing in 45 seconds.")

    # Left Card: Pipeline Architecture
    add_card(s4, Inches(0.8), Inches(1.8), Inches(5.6), Inches(5.0))
    b_left = s4.shapes.add_textbox(Inches(1.05), Inches(2.05), Inches(5.1), Inches(4.5))
    tf_l = b_left.text_frame
    tf_l.word_wrap = True
    
    p = tf_l.paragraphs[0]
    p.text = "Multi-Query Search Pipeline"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = ACCENT_CYAN
    
    queries = [
        ("📰 Corporate News", "Press releases, official statements, earnings"),
        ("💰 Funding & Valuation", "Venture rounds, valuation shifts, investors"),
        ("🚀 Product Releases", "Feature launches, new betas, tech updates"),
        ("👥 Leadership Moves", "CEO/Founder changes, executive appointments"),
        ("🤝 Strategic Deals", "Partnerships, integrations, M&A activity")
    ]
    for q_tit, q_sub in queries:
        tf_l.add_paragraph()
        p_q = tf_l.add_paragraph()
        p_q.text = q_tit
        p_q.font.size = Pt(12)
        p_q.font.bold = True
        p_q.font.color.rgb = TEXT_WHITE
        p_qs = tf_l.add_paragraph()
        p_qs.text = f"• {q_sub}"
        p_qs.font.size = Pt(10.5)
        p_qs.font.color.rgb = TEXT_MUTED

    # Right Card: The Synthesized Dossier
    add_card(s4, Inches(6.8), Inches(1.8), Inches(5.7), Inches(5.0))
    b_right = s4.shapes.add_textbox(Inches(7.05), Inches(2.05), Inches(5.2), Inches(4.5))
    tf_r = b_right.text_frame
    tf_r.word_wrap = True
    
    pr = tf_r.paragraphs[0]
    pr.text = "Synthesized Executive Dossier"
    pr.font.size = Pt(18)
    pr.font.bold = True
    pr.font.color.rgb = ACCENT_EMERALD
    
    dossier_sections = [
        ("Executive Snapshot", "2-3 sentence high-level state of target company with factual confidence score."),
        ("Key Developments", "Ranked recent events strictly from the trailing 30-day window with direct source links."),
        ("Key People Bios", "Target attendee background, recent initiatives, and why they matter to the meeting."),
        ("Strategic Talking Points", "5 concrete conversational topics aligned with meeting goals."),
        ("Opportunity & Risk Radar", "Potential collaboration synergies and landmines to steer clear of.")
    ]
    for d_tit, d_desc in dossier_sections:
        tf_r.add_paragraph()
        p_d = tf_r.add_paragraph()
        p_d.text = d_tit
        p_d.font.size = Pt(12)
        p_d.font.bold = True
        p_d.font.color.rgb = TEXT_WHITE
        p_ds = tf_r.add_paragraph()
        p_ds.text = f"• {d_desc}"
        p_ds.font.size = Pt(10.5)
        p_ds.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 5: DEEP DIVE - IN-MEETING CHROME EXTENSION
    # =========================================================================
    s5 = prs.slides.add_slide(blank_layout)
    set_slide_background(s5)
    add_header(s5, "Feature Deep Dive", "Stage 2: Ambient Chrome Companion (Manifest V3)", "Zero-setup live transcription living directly in your active meeting video tab.")

    ext_cards = [
        {
            "icon": "📹",
            "title": "Auto Platform Detection",
            "badge": "Content Scripts",
            "desc": "Automatically detects when you enter Google Meet, Zoom, or Microsoft Teams, opening the side panel without manual intervention."
        },
        {
            "icon": "🎙️",
            "title": "Live Speech Transcription",
            "badge": "Web Speech API",
            "desc": "Streams real-time microphone input into timestamped dialogue blocks. Zero cloud delay, instant visual feedback."
        },
        {
            "icon": "✨",
            "title": "AI Phonetic Polish",
            "badge": "Gemini 2.0 Flash",
            "desc": "Intelligent post-speech filter fixes misheard phonetic spellings, capitalization of proper nouns, and punctuation without altering meaning."
        },
        {
            "icon": "🔒",
            "title": "Consent & Privacy Guard",
            "badge": "Security & RLS",
            "desc": "Built with clear audio recording disclosures and encrypted transmission directly to user-isolated PostgreSQL tables."
        }
    ]

    for i, c in enumerate(ext_cards):
        col = i % 2
        row = i // 2
        c_left = Inches(0.8 + col * 5.95)
        c_top = Inches(1.8 + row * 2.5)
        add_card(s5, c_left, c_top, Inches(5.75), Inches(2.3))
        
        box = s5.shapes.add_textbox(c_left + Inches(0.25), c_top + Inches(0.2), Inches(5.25), Inches(1.9))
        tf = box.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = f"{c['icon']} {c['title']}  •  [{c['badge']}]"
        p1.font.size = Pt(15)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_CYAN
        
        tf.add_paragraph()
        p2 = tf.add_paragraph()
        p2.text = c['desc']
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 6: DEEP DIVE - POST-MEETING INTELLIGENCE
    # =========================================================================
    s6 = prs.slides.add_slide(blank_layout)
    set_slide_background(s6)
    add_header(s6, "Feature Deep Dive", "Stage 3: Post-Meeting Intelligence & Action Engine", "Closing the loop from spoken words to concrete commitments and ready-to-send follow-ups.")

    features = [
        ("⚖️ Anticipated vs. Actual", "Compares real conversation against pre-call briefing to highlight surprises and confirmed hypotheses."),
        ("✅ Decision Log", "Extracts explicit agreements and confirmed decisions with operational rationale and owners."),
        ("🎯 Prioritized Action Items", "Categorizes tasks into High, Medium, and Low urgency with assigned owners and due dates."),
        ("❓ Unresolved Questions", "Surfaces topics and questions that were raised on the call but left unanswered."),
        ("✉️ Automated Follow-Up Email", "Generates professional email body and subject line referencing decisions, ready for 1-click clipboard copy."),
        ("📈 Effectiveness Score", "Provides an honest evaluation of whether the meeting successfully fulfilled its stated objective.")
    ]

    for i, (f_title, f_desc) in enumerate(features):
        col = i % 3
        row = i // 3
        c_left = Inches(0.8 + col * 3.98)
        c_top = Inches(1.8 + row * 2.5)
        add_card(s6, c_left, c_top, Inches(3.75), Inches(2.3))
        
        box = s6.shapes.add_textbox(c_left + Inches(0.2), c_top + Inches(0.2), Inches(3.35), Inches(1.9))
        tf = box.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = f_title
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_PURPLE
        
        tf.add_paragraph()
        p2 = tf.add_paragraph()
        p2.text = f_desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 7: SYSTEM ARCHITECTURE
    # =========================================================================
    s7 = prs.slides.add_slide(blank_layout)
    set_slide_background(s7)
    add_header(s7, "System Architecture", "High-Performance Full-Stack & AI Pipeline", "A decoupled, scalable architecture designed for low-latency synthesis and enterprise security.")

    arch_blocks = [
        {
            "title": "Client & Companion Layer",
            "tech": "Next.js 15.1 + React 19 + Chrome MV3",
            "desc": "Responsive web dashboard with server-side rendering, Radix UI primitives, Lucide icons, and a background service worker companion extension.",
            "accent": ACCENT_CYAN
        },
        {
            "title": "Backend Orchestration",
            "tech": "FastAPI (Python 3.11) + BackgroundTasks",
            "desc": "Asynchronous API gateway handling meeting CRUD, concurrent multi-query Tavily search jobs, streaming speech cleanup, and token management.",
            "accent": ACCENT_EMERALD
        },
        {
            "title": "AI & Intelligence Services",
            "tech": "Google Gemini 2.0 Flash + Claude Opus / 3.5",
            "desc": "Dual-LLM orchestration: Claude handles multi-source synthesis, while Gemini 2.0 Flash handles low-latency transcript cleaning and post-meeting analysis.",
            "accent": ACCENT_PURPLE
        },
        {
            "title": "Persistence & Security",
            "tech": "Supabase PostgreSQL + Strict RLS",
            "desc": "PostgreSQL relational engine with Row Level Security enforcing auth.uid() = user_id on every query, ensuring total tenant data isolation.",
            "accent": ACCENT_AMBER
        }
    ]

    for i, b in enumerate(arch_blocks):
        c_left = Inches(0.8 + i * 2.98)
        add_card(s7, c_left, Inches(1.8), Inches(2.8), Inches(5.0))
        
        box = s7.shapes.add_textbox(c_left + Inches(0.2), Inches(2.05), Inches(2.4), Inches(4.5))
        tf = box.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = f"TIER 0{i+1}"
        p1.font.size = Pt(10)
        p1.font.bold = True
        p1.font.color.rgb = b['accent']
        
        p2 = tf.add_paragraph()
        p2.text = b['title']
        p2.font.size = Pt(15)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_WHITE
        
        p3 = tf.add_paragraph()
        p3.text = b['tech']
        p3.font.size = Pt(10)
        p3.font.bold = True
        p3.font.color.rgb = b['accent']
        
        tf.add_paragraph()
        p4 = tf.add_paragraph()
        p4.text = b['desc']
        p4.font.size = Pt(11)
        p4.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 8: TECHNICAL INNOVATION & ENGINEERING
    # =========================================================================
    s8 = prs.slides.add_slide(blank_layout)
    set_slide_background(s8)
    add_header(s8, "Engineering Excellence", "Key Technical Innovations & Edge Handling", "Solving hard real-world problems in generative AI, latency, and data integrity.")

    tech_points = [
        ("🔄 Dual-Provider Failover Architecture", "Backend automatically checks for Anthropic Claude keys; seamlessly routes to Google Gemini 2.0 Flash if Anthropic is unconfigured. Zero setup friction for any evaluator."),
        ("🛡️ Truncation Recovery & JSON Self-Repair", "LLMs occasionally hit token boundaries on massive briefings. We implemented a backward brace-recovery algorithm that repairs partial JSON responses without failing the job."),
        ("⏱️ Strict 30-Day Temporal Filtering", "Web search is often polluted with 5-year-old press releases. Tavily multi-category searches are algorithmically capped at a 30-day cutoff relative to the scheduled meeting date."),
        ("🔐 Multi-Tenant Row Level Security (RLS)", "Every single database table (meetings, jobs, findings, briefings, transcripts) enforces PostgreSQL RLS (auth.uid() = user_id) preventing cross-account leaks.")
    ]

    for i, (t_title, t_desc) in enumerate(tech_points):
        c_top = Inches(1.8 + i * 1.25)
        add_card(s8, Inches(0.8), c_top, Inches(11.733), Inches(1.1))
        
        box = s8.shapes.add_textbox(Inches(1.05), c_top + Inches(0.12), Inches(11.2), Inches(0.85))
        tf = box.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = t_title
        p1.font.size = Pt(14)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_CYAN
        
        p2 = tf.add_paragraph()
        p2.text = t_desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 9: TARGET AUDIENCE & MARKET OPPORTUNITY
    # =========================================================================
    s9 = prs.slides.add_slide(blank_layout)
    set_slide_background(s9)
    add_header(s9, "Market & Impact", "Massive Value Across High-Stakes Professionals", "Designed for knowledge workers where meeting outcomes directly impact revenue and growth.")

    personas = [
        {
            "icon": "💼",
            "role": "Sales & Account Execs",
            "impact": "+35% Win Rate",
            "use_case": "Walk into discovery and demo calls knowing the prospect's exact funding status, leadership changes, and active product rollouts."
        },
        {
            "icon": "🚀",
            "role": "Founders & Executives",
            "impact": "5+ Hours Saved / Wk",
            "use_case": "Review investor background before pitching; auto-generate professional follow-up emails and action logs immediately after calls."
        },
        {
            "icon": "🤝",
            "role": "Consultants & Recruiters",
            "impact": "100% Client Retention",
            "use_case": "Instant briefing on client company dynamics, followed by automated structured summaries sent to team stakeholders."
        }
    ]

    for i, p in enumerate(personas):
        c_left = Inches(0.8 + i * 3.98)
        add_card(s9, c_left, Inches(1.8), Inches(3.75), Inches(5.0))
        
        box = s9.shapes.add_textbox(c_left + Inches(0.25), Inches(2.05), Inches(3.25), Inches(4.5))
        tf = box.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = f"{p['icon']}  {p['role']}"
        p1.font.size = Pt(16)
        p1.font.bold = True
        p1.font.color.rgb = TEXT_WHITE
        
        tf.add_paragraph()
        p2 = tf.add_paragraph()
        p2.text = p['impact']
        p2.font.size = Pt(24)
        p2.font.bold = True
        p2.font.color.rgb = ACCENT_EMERALD
        
        p_div = tf.add_paragraph()
        p_div.text = "—" * 16
        p_div.font.size = Pt(9)
        p_div.font.color.rgb = CARD_BORDER
        
        p3 = tf.add_paragraph()
        p3.text = p['use_case']
        p3.font.size = Pt(12)
        p3.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 10: PRODUCT ROADMAP
    # =========================================================================
    s10 = prs.slides.add_slide(blank_layout)
    set_slide_background(s10)
    add_header(s10, "Product Roadmap", "Future Vision: The Ambient Enterprise Co-Pilot", "Expanding from individual companion to an enterprise-wide meeting intelligence platform.")

    phases = [
        {
            "phase": "Q1 2027",
            "title": "Calendar Sync Engine",
            "items": ["Google Calendar & Outlook 365 OAuth", "Automatic briefing generation 1 hr before calls", "Mobile notifications with dossier snapshot"]
        },
        {
            "phase": "Q2 2027",
            "title": "Dual-Audio Diarization",
            "items": ["System audio + mic tab capture", "Speaker voiceprint recognition & labeling", "Local Whisper fine-tuning for zero data leaks"]
        },
        {
            "phase": "Q3 2027",
            "title": "Live Objection Co-Pilot",
            "items": ["Real-time in-call sidepanel suggestions", "Instant fact retrieval during active speaking", "Automated competitive counter-arguments"]
        },
        {
            "phase": "Q4 2027",
            "title": "CRM & Team Workspaces",
            "items": ["1-Click Salesforce & HubSpot deal logging", "Notion & Slack automated sync", "Team intelligence sharing & workspace analytics"]
        }
    ]

    for i, ph in enumerate(phases):
        c_left = Inches(0.8 + i * 2.98)
        add_card(s10, c_left, Inches(1.8), Inches(2.8), Inches(5.0))
        
        box = s10.shapes.add_textbox(c_left + Inches(0.2), Inches(2.05), Inches(2.4), Inches(4.5))
        tf = box.text_frame
        tf.word_wrap = True
        
        p1 = tf.paragraphs[0]
        p1.text = ph['phase']
        p1.font.size = Pt(11)
        p1.font.bold = True
        p1.font.color.rgb = ACCENT_CYAN
        
        p2 = tf.add_paragraph()
        p2.text = ph['title']
        p2.font.size = Pt(15)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_WHITE
        
        tf.add_paragraph()
        for item in ph['items']:
            p_it = tf.add_paragraph()
            p_it.text = f"• {item}"
            p_it.font.size = Pt(11)
            p_it.font.color.rgb = TEXT_MUTED

    # =========================================================================
    # SLIDE 11: CONCLUSION / SUMMARY SLIDE
    # =========================================================================
    s11 = prs.slides.add_slide(blank_layout)
    set_slide_background(s11)

    # Hero card
    add_card(s11, Inches(0.8), Inches(0.9), Inches(11.733), Inches(5.7), CARD_BG, CARD_BORDER)

    box = s11.shapes.add_textbox(Inches(1.3), Inches(1.4), Inches(10.7), Inches(4.8))
    tf = box.text_frame
    tf.word_wrap = True
    
    p1 = tf.paragraphs[0]
    p1.text = "Walk Into Every Meeting Fully Prepared."
    p1.font.size = Pt(36)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE
    
    p2 = tf.add_paragraph()
    p2.text = "MeetBrief AI automates the entire meeting lifecycle: before, during, and after."
    p2.font.size = Pt(18)
    p2.font.color.rgb = ACCENT_CYAN
    
    tf.add_paragraph()
    p3 = tf.add_paragraph()
    p3.text = "Submission Highlights:"
    p3.font.size = Pt(15)
    p3.font.bold = True
    p3.font.color.rgb = TEXT_WHITE
    
    summary_bullets = [
        "Full-Stack Implementation: Next.js 15, FastAPI, Supabase PostgreSQL, Chrome Extension Manifest V3.",
        "Production AI Integration: Google Gemini 2.0 Flash + Anthropic Claude + Tavily Search API.",
        "Zero-Trust Architecture: Multi-tenant PostgreSQL Row-Level Security on all tables.",
        "Real-Time Capabilities: Browser Web Speech API transcription + LLM phonetic repair pipeline."
    ]
    for b in summary_bullets:
        pb = tf.add_paragraph()
        pb.text = f"  ✓  {b}"
        pb.font.size = Pt(13)
        pb.font.color.rgb = TEXT_MUTED

    tf.add_paragraph()
    pf = tf.add_paragraph()
    pf.text = "🔗 GitHub Repository: https://github.com/midenotch/meetbrief-ai\nDeveloped by midenotch (midenotch@gmail.com)"
    pf.font.size = Pt(13)
    pf.font.bold = True
    pf.font.color.rgb = ACCENT_EMERALD

    # Save
    prs.save(output_path)
    print(f"Successfully generated {output_path}")

if __name__ == "__main__":
    build_presentation()
