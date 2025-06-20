#let main(data) = {
  // Set document properties
  set page(
    paper: "a4",
    margin: (top: 1.5cm, bottom: 1.5cm, left: 1.5cm, right: 1.5cm)
  )
  
  set text(
    font: ("Times New Roman", "Arial" ),
    size: 9pt,
    lang: "ru"
  )
  
  set par(leading: 0.5em)
  
  // Helper function to format currency
  let formatCurrency(amount) = {
    let formatted = str(calc.round(amount, digits: 2))
    let parts = formatted.split(".")
    let integerPart = parts.at(0)
    let decimalPart = if parts.len() > 1 { parts.at(1) } else { "00" }
    
    // Add thousand separators (spaces)
    let digits = integerPart.clusters().rev()
    let groups = ()
    let currentGroup = ""
    
    for (i, digit) in digits.enumerate() {
      currentGroup = digit + currentGroup
      if calc.rem(i + 1, 3) == 0 and i + 1 < digits.len() {
        groups.push(currentGroup)
        currentGroup = ""
      }
    }
    if currentGroup != "" {
      groups.push(currentGroup)
    }
    
    let formattedInteger = groups.rev().join(" ")
    return formattedInteger + "," + decimalPart
  }
  
  // Helper function to format date
  let formatDate(dateStr) = {
    if dateStr == "" { return "" }
    if type(dateStr) == "datetime" {
      return dateStr.display("[day].[month].[year]")
    }
    let parts = str(dateStr).split("-")
    if parts.len() != 3 { return str(dateStr) }
    return parts.at(2) + "." + parts.at(1) + "." + parts.at(0)
  }
  
  // Company header information
  text(size: 10pt, weight: "bold")[
    Наименование ТОО "COMABOOKSS", Г.АСТАНА, РАЙОН АЛМАТЫ
  ]
  
  v(5pt)
  
  text(size: 9pt)[БИН/ИИН: #data.sellerBin]
  
  v(5pt)
  
  text(size: 9pt)[Счет: #data.at("sellerAccount", default: "")]
  
  v(5pt)
  
  text(size: 9pt)[БИК: #data.at("sellerBik", default: "")]
  
  v(5pt)
  
  text(size: 9pt)[Банк: #data.at("sellerBank", default: "")]
  
  v(5pt)
  
  text(size: 9pt)[КНП: #data.at("knp", default: "002")]
  
  v(25pt)
  
  // Main invoice title
  align(center)[
    #text(size: 14pt, weight: "bold")[
      СЧЕТ НА ОПЛАТУ №#data.invoiceNumber от #data.invoiceDate #data.invoiceTime
    ]
  ]
  
  v(15pt)
  
  // Customer information
  text(size: 9pt)[Покупатель: #data.buyerName, БИН/ИИН: #data.buyerBin]
  
  v(10pt)
  
  text(size: 9pt)[#data.at("contractReference", default: "")]
  
  v(20pt)
  
  // Items table
  let tableData = data.items
  let totalAmount = tableData.fold(0, (sum, item) => sum + item.quantity * item.price)
  let vatRate = data.at("vatRate", default: 0.12)
  let vatAmount = totalAmount * vatRate
  
  table(
    columns: (30pt, 50pt, 200pt, 60pt, 80pt, 80pt, 80pt),
    stroke: 0.5pt,
    inset: 8pt,
    
    // Header row
    table.cell()[
      #set align(center + horizon)
      #set text(size: 8pt, weight: "bold")
      №
    ],
    
    table.cell()[
      #set align(center + horizon)
      #set text(size: 8pt, weight: "bold")
      Код
    ],
    
    table.cell()[
      #set align(center + horizon)
      #set text(size: 8pt, weight: "bold")
      Наименование
    ],
    
    table.cell()[
      #set align(center + horizon)
      #set text(size: 8pt, weight: "bold")
      Количество
    ],
    
    table.cell()[
      #set align(center + horizon)
      #set text(size: 8pt, weight: "bold")
      Единица измерения
    ],
    
    table.cell()[
      #set align(center + horizon)
      #set text(size: 8pt, weight: "bold")
      Цена за ед.
    ],
    
    table.cell()[
      #set align(center + horizon)
      #set text(size: 8pt, weight: "bold")
      Сумма
    ],
    
    // Data rows
    ..tableData.enumerate().map(((index, item)) => {
      let itemTotal = item.quantity * item.price
      
      (
        // Column 1: Number
        align(center)[
          #text(size: 8pt)[#str(index + 1)]
        ],
        
        // Column 2: Code
        align(center)[
          #text(size: 8pt)[#item.at("code", default: "00004")]
        ],
        
        // Column 3: Description
        align(left)[
          #text(size: 8pt)[#item.name]
        ],
        
        // Column 4: Quantity
        align(center)[
          #text(size: 8pt)[#str(item.quantity)]
        ],
        
        // Column 5: Unit
        align(center)[
          #text(size: 8pt)[#item.unit]
        ],
        
        // Column 6: Price
        align(right)[
          #text(size: 8pt)[#formatCurrency(item.price)]
        ],
        
        // Column 7: Total
        align(right)[
          #text(size: 8pt)[#formatCurrency(itemTotal)]
        ]
      )
    }).flatten(),
    
    // Empty row
    [], [], [], [], [], [], [],
    
    // Totals rows
    [], [], [], [], [], 
    align(right)[
      #text(size: 8pt, weight: "bold")[ИТОГО:]
    ],
    align(right)[
      #text(size: 8pt, weight: "bold")[#formatCurrency(totalAmount)]
    ],
    
    [], [], [], [], [],
    align(right)[
      #text(size: 8pt, weight: "bold")[В том числе НДС:]
    ],
    align(right)[
      #text(size: 8pt, weight: "bold")[#formatCurrency(vatAmount)]
    ]
  )
  
  v(15pt)
  
  // Summary section
  let itemCount = tableData.len()
  text(size: 9pt)[
    Всего наименований #str(itemCount), на сумму: #formatCurrency(totalAmount) KZT
  ]
  
  v(5pt)
  
  text(size: 9pt, weight: "bold")[
    Всего к оплате: #data.totalInWords
  ]
  
  v(40pt)
  
  // Contact information
  text(size: 8pt)[
    Для согласования условий и уточнения деталей просьба связаться по телефону \
    #data.at("contactPhone", default: "87477774873")
  ]
  
  v(20pt)
  
  // Signature section
  grid(
    columns: (auto, 1fr, auto),
    column-gutter: 10pt,
    
    text(size: 9pt)[Исполнитель:],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: 0.5pt),
      v(-10pt),
      align(center)[
        #text(size: 8pt)[]
      ]
    ),
    
    text(size: 9pt)[#data.at("executorName", default: ""), #data.executorPosition]
  )
} 