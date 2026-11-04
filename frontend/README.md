# FinanceIQ - AI-Powered Financial Dashboard for SMEs

A comprehensive, intelligent financial management system designed specifically for small and medium enterprises.

## 🎯 Project Overview

**Project Name:** Intelligent data-driven assistant for SMEs: from primary audit to strategic financial reporting

**Purpose:** Provide SME owners and managers with AI-powered financial insights, automated bookkeeping, fraud detection, and strategic reporting capabilities - all in simple, non-technical language.

## 📱 Application Screens

The application consists of 7 separate screens, each serving a specific purpose:

### Screen 0 - Landing Page (`/components/LandingPage.tsx`)
- Product value proposition
- Key benefits and features
- Call-to-action buttons for sign-up and login
- Feature highlights showcasing AI insights, fraud detection, and forecasting
- Professional marketing layout with gradient backgrounds

### Screen 1 - Login & Onboarding (`/components/LoginOnboarding.tsx`)
- Login and sign-up forms with tabs
- Multi-step onboarding flow with progress indicators
- Options to connect:
  - Bank accounts
  - Accounting software (QuickBooks, Xero)
  - ERP systems
- Business information collection

### Screen 2 - Main Dashboard (`/components/MainDashboard.tsx`)
- Financial health summary with KPIs:
  - Total Revenue
  - Total Expenses
  - Net Profit
  - Cash Flow
- Revenue vs Expenses charts
- Expense breakdown (pie chart)
- AI-generated insights panel
- Real-time alerts and notifications
- Cash flow trend analysis

### Screen 3 - Audit & Bookkeeping (`/components/AuditBookkeeping.tsx`)
- Automated transaction categorization
- AI confidence scores for each transaction
- Document upload with OCR processing
- Audit completion progress tracking
- Error and missing data highlights
- Transaction search and filtering

### Screen 4 - Fraud Detection & Risk Monitoring (`/components/FraudDetection.tsx`)
- Overall risk level assessment
- Anomaly detection charts
- Suspicious transaction list with risk scores
- Multiple fraud indicators (timing, amount, patterns)
- AI explanations in plain language
- Transaction review and approval workflow

### Screen 5 - Business Intelligence (`/components/BusinessIntelligence.tsx`)
- Interactive revenue and expense forecasts
- Predictive analytics with confidence levels
- Scenario simulations (conservative, expected, optimistic)
- AI-driven strategic recommendations
- Customer growth trends
- Key business insights

### Screen 6 - Strategic Financial Reporting (`/components/StrategyReporting.tsx`)
- Automatically generated professional reports
- Financing readiness score
- Strategic financial analysis
- Future projections (12-month forecast)
- Download options (PDF, Excel, PowerPoint)
- Multiple report templates

## 🎨 Design System

### Color Palette
- **Primary Blue:** #3b82f6 (Professional, trustworthy)
- **Purple Accent:** #8b5cf6 (AI/Technology)
- **Green Success:** #10b981 (Positive metrics)
- **Orange Warning:** #f97316 (Alerts)
- **Red Danger:** #ef4444 (High risk)
- **Slate Gray:** #64748b (Text and borders)

### Layout
- **Desktop Width:** 1440px optimized
- **Sidebar:** 256px fixed width
- **Clean, minimal spacing:** Consistent padding and margins
- **Card-based design:** Elevated components with shadows
- **Responsive grids:** Adapts to different content types

### Typography
- Modern sans-serif font system
- Clear hierarchy with font sizes and weights
- Non-technical, business-friendly language

## 🤖 AI Features

### AI Assistant Widget (`/components/AIAssistant.tsx`)
- Floating chat interface
- Contextual financial insights
- Quick action suggestions
- Natural language query support
- Real-time responses based on user data

### AI Capabilities Across Screens
1. **Automated Categorization:** Learns from patterns to classify transactions
2. **Fraud Detection:** Pattern analysis to identify suspicious activity
3. **Predictive Forecasting:** ML-based revenue and expense predictions
4. **Scenario Analysis:** Simulates different business outcomes
5. **Strategic Recommendations:** Actionable insights for growth

## 🏗️ Technical Architecture

### Component Structure
```
/App.tsx                          # Main routing and state management
/components/
  ├── LandingPage.tsx             # Screen 0
  ├── LoginOnboarding.tsx         # Screen 1
  ├── DashboardLayout.tsx         # Shared layout for all dashboard screens
  ├── MainDashboard.tsx           # Screen 2
  ├── AuditBookkeeping.tsx        # Screen 3
  ├── FraudDetection.tsx          # Screen 4
  ├── BusinessIntelligence.tsx    # Screen 5
  ├── StrategyReporting.tsx       # Screen 6
  └── AIAssistant.tsx             # AI chat widget
```

### Navigation Flow
```
Landing → Login/Onboarding → Main Dashboard
                                    ↓
        ┌───────────────────────────┼───────────────────────────┐
        ↓                           ↓                           ↓
    Audit &                   Fraud Detection            Business Intelligence
    Bookkeeping                     ↓                           ↓
                              Strategic Reporting
```

### State Management
- Simple React `useState` for screen routing
- Each screen is independently rendered
- Props-based navigation between screens

## 📊 Data Visualization

Uses **Recharts** library for all charts:
- Area charts (revenue trends)
- Line charts (forecasts)
- Bar charts (cash flow, scenarios)
- Pie charts (expense breakdown)
- Composed charts (multi-metric analysis)

## 🎯 Target Users

- **Primary:** SME owners and managers
- **Secondary:** Finance teams in small businesses
- **Knowledge Level:** Basic financial understanding (non-accountants)
- **Use Cases:**
  - Daily financial monitoring
  - Monthly reporting
  - Investor presentations
  - Financing applications
  - Strategic planning

## 🔑 Key Features

### For Business Owners
✅ Plain language explanations
✅ Automated bookkeeping (saves 20+ hours/month)
✅ Real-time fraud detection
✅ Cash flow forecasting
✅ One-click professional reports

### For Growth
✅ AI-driven recommendations
✅ Scenario planning
✅ Investor-ready reports
✅ Financing readiness scoring
✅ Strategic insights

## 🚀 Getting Started

1. **Landing Page:** Learn about FinanceIQ features
2. **Sign Up:** Create account with business information
3. **Onboarding:** Connect bank accounts or upload documents
4. **Dashboard:** View automated insights immediately
5. **Explore:** Navigate through different analytical views
6. **Report:** Generate and download professional reports

## 💡 Usage Tips

- Use the **AI Assistant** (bottom-right) for quick questions
- Check the **Main Dashboard** daily for health overview
- Review **Fraud Detection** alerts weekly
- Generate **Strategic Reports** monthly for stakeholders
- Use **Business Intelligence** for planning and forecasting

## 🎨 Design Philosophy

1. **Simplicity:** Complex data presented clearly
2. **Accessibility:** Non-technical language throughout
3. **Actionability:** Insights lead to concrete recommendations
4. **Transparency:** AI confidence scores shown
5. **Professional:** Investor and lender-ready outputs

---

**Built with:** React, TypeScript, Tailwind CSS, Recharts, Lucide Icons
**Optimized for:** SME financial management and strategic planning
