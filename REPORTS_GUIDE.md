# Reports Guide - INFORA

## Available Report Types

INFORA provides 5 comprehensive report types to help you manage and track your IT device inventory effectively.

---

## 📋 1. Operations Report

**Purpose**: Track all device assignment operations within the last month

### What It Includes:
- Date of operation
- Device name, type, and serial number
- User who received the device
- User's department
- Operation status (Active/Returned)

### Data Period:
- Last 30 days from the report generation date

### Use Cases:
- Monthly activity tracking
- Auditing recent device movements
- Understanding usage patterns
- Compliance reporting

### PDF Filename Format:
`operations_report_YYYY-MM-DD.pdf`

### Sample Data:
| Date | Device | Type | Serial No. | User | Department | Status |
|------|--------|------|-----------|------|------------|--------|
| 11/01/2024 | MacBook Pro | Laptop | MBP14-003 | John Doe | Sales | Active |
| 10/28/2024 | Dell Monitor | Monitor | DU2720-004 | Jane Smith | Marketing | Returned |

---

## 💼 2. Asset Report

**Purpose**: Complete inventory of all devices currently assigned to employees

### What It Includes:
- Employee name and department
- Device name, type, and serial number
- Purchase date
- Assignment date

### Filter Criteria:
- Only shows devices with status: **Assigned**

### Use Cases:
- Asset accountability
- Employee device tracking
- Department-wise asset distribution
- Insurance documentation
- Annual inventory audits

### PDF Filename Format:
`asset_report_YYYY-MM-DD.pdf`

### Sample Data:
| Employee | Department | Device | Type | Serial Number | Purchase Date | Assigned Date |
|----------|-----------|--------|------|---------------|---------------|---------------|
| John Doe | Sales | HP EliteBook | Laptop | HP840-002 | 02/20/2023 | 10/01/2024 |
| Jane Smith | Marketing | MacBook Pro | Laptop | MBP14-003 | 03/10/2023 | 09/15/2024 |

---

## 👤 3. User Devices Report

**Purpose**: Detailed breakdown showing each user and ALL their assigned devices

### What It Includes:
- User information (name, email, department)
- Count of devices assigned to each user
- List of all devices per user:
  - Device name and type
  - Serial number
  - Assignment date

### Report Structure:
Organized by user, showing their complete device inventory

### Use Cases:
- User-centric device tracking
- Verifying employee equipment
- Planning device assignments
- Employee onboarding/offboarding
- User accountability reports

### PDF Filename Format:
`user_devices_report.pdf`

### Sample Layout:
```
John Doe (Sales Department)
Email: john.doe@tamergroup.com
Devices Assigned: 3

┌────────────────┬─────────┬──────────────┬───────────────┐
│ Device Name    │ Type    │ Serial No.   │ Assigned Date │
├────────────────┼─────────┼──────────────┼───────────────┤
│ HP EliteBook   │ Laptop  │ HP840-002    │ 10/01/2024   │
│ Dell Monitor   │ Monitor │ DU2720-004   │ 10/01/2024   │
│ Logitech MX    │ Keyboard│ LMXK-010     │ 10/01/2024   │
└────────────────┴─────────┴──────────────┴───────────────┘
```

---

## 📦 4. Available Stock Report

**Purpose**: Inventory of all devices available for assignment

### What It Includes:
- Summary count by device type
- Detailed list of each available device:
  - Type and name
  - Serial number
  - Specifications
  - Purchase date
  - Warranty expiry date

### Filter Criteria:
- Only shows devices with status: **Available**

### Use Cases:
- Stock level monitoring
- Planning new assignments
- Procurement planning
- Quick device availability check
- Budget allocation

### PDF Filename Format:
`available_stock_report_YYYY-MM-DD.pdf`

### Sample Summary:
```
Laptop: 3 units
Monitor: 2 units
Desktop: 1 unit
Mobile: 2 units
```

### Sample Data:
| Type | Device Name | Serial Number | Specifications | Purchase Date | Warranty Expiry |
|------|------------|---------------|----------------|---------------|-----------------|
| Laptop | Dell Latitude | DL5520-001 | i7, 16GB, 512GB | 01/15/2023 | 01/15/2026 |
| Monitor | Dell UltraSharp | DU2720-004 | 27" 4K IPS | 01/20/2023 | 01/20/2026 |

---

## 🛡️ 5. Warranty Status Report

**Purpose**: Track devices still under warranty (within 4 years of purchase)

### What It Includes:
- Device name, type, and serial number
- Purchase date
- Warranty end date (4 years from purchase)
- Days remaining in warranty
- Current device status

### Warranty Calculation:
- **Warranty Period**: 4 years from purchase date
- **Formula**: Purchase Date + 4 years = Warranty End Date
- Automatically calculates days remaining

### Filter Criteria:
- Includes all devices purchased within the last 4 years
- Shows both active and expired warranties

### Use Cases:
- Warranty management
- Maintenance planning
- Replacement scheduling
- Budget forecasting for out-of-warranty devices
- Insurance claims preparation

### PDF Filename Format:
`warranty_report_YYYY-MM-DD.pdf`

### Sample Data:
| Device Name | Type | Serial Number | Purchase Date | Warranty Ends | Days Remaining | Status |
|------------|------|---------------|---------------|---------------|----------------|---------|
| MacBook Pro | Laptop | MBP14-003 | 03/10/2023 | 03/10/2027 | 863 days | assigned |
| Dell Monitor | Monitor | DU2720-004 | 01/20/2023 | 01/20/2027 | 814 days | available |
| HP LaserJet | Printer | HPLJ404-009 | 02/25/2021 | 02/25/2025 | 115 days | available |

---

## 🎨 Report Features

### All Reports Include:
✅ **Professional Header** with report title  
✅ **Generation Date** - when the report was created  
✅ **Summary Statistics** - total counts and key metrics  
✅ **Detailed Tables** - comprehensive data in table format  
✅ **Green Theme** - matching INFORA branding  
✅ **Auto-Download** - PDF downloads automatically when ready  
✅ **Timestamped Filenames** - easy to organize and archive  

### PDF Table Features:
- **Striped rows** for easy reading
- **Optimized font sizes** for maximum data display
- **Professional formatting** with headers and borders
- **Auto-pagination** for large datasets
- **Summary sections** where applicable

---

## 📊 How to Generate Reports

### Step-by-Step:

1. **Navigate to Reports Page**
   - Click "Reports" in the sidebar

2. **Select Report Type**
   - Click on any of the 5 colorful report cards
   - The selected report will highlight in green

3. **Review Report Information**
   - Read the description of what data will be included
   - Check the "Report Information" section for details

4. **Generate & Download**
   - Click "Generate & Download PDF" button
   - Wait for the generation process (usually 1-3 seconds)
   - PDF will download automatically to your downloads folder

5. **View the Report**
   - Open the downloaded PDF
   - Review the data
   - Print or share as needed

---

## 💡 Best Practices

### When to Use Each Report:

| Report Type | Frequency | Best For |
|------------|-----------|----------|
| Operations | Monthly | Monthly reviews, audit trails |
| Asset | Quarterly | Inventory audits, insurance updates |
| User Devices | As Needed | User verification, accountability |
| Available Stock | Weekly | Procurement planning, assignments |
| Warranty | Monthly | Maintenance planning, budgeting |

### Tips:
- **Generate reports regularly** for trend analysis
- **Archive reports** by date for historical records
- **Share with management** for decision-making
- **Use for budgeting** (especially warranty report)
- **Track changes** month-over-month

---

## 🔍 Data Sources

All reports pull live data from your Supabase database:

- **Devices Table**: Device information, status, assignments
- **Users Table**: Employee information, departments
- **Assignments Table**: Assignment history and operations

Reports are generated in **real-time**, ensuring you always have the most current data.

---

## 📱 Mobile Access

All reports can be generated from any device with access to INFORA:
- Desktop computers
- Tablets
- Mobile phones (landscape mode recommended)

---

## 🆘 Troubleshooting

### Report Not Generating?
1. Check your internet connection
2. Ensure you're logged in
3. Refresh the page and try again

### Empty Report?
- Means no data matches the report criteria
- Check if you have devices in that category

### PDF Won't Open?
- Ensure you have a PDF reader installed
- Try a different browser
- Check your downloads folder

---

## 📞 Support

For questions about reports or data discrepancies, contact your system administrator.

---

**INFORA Reports System**  
Version 1.0.0  
© 2024 Tamer Consumer Company

