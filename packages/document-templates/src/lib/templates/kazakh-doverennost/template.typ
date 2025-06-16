#let main(data) = {
  // Set document properties
  set page(
    paper: "a4",
    margin: (top: 1.5cm, bottom: 1.5cm, left: 1cm, right: 1cm)
  )
  
  set text(
    font: ("Liberation Sans", "Arial", "sans-serif"),
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
  
  // Header section with legal references
  grid(
    columns: (1fr, 200pt),
    column-gutter: 10pt,
    
    // Left side - empty
    [],
    
    // Right side - Legal references
    stack(
      spacing: 3pt,
      
      rect(
        width: 100%,
        stroke: 0pt,
        inset: 3pt
      )[
        #set text(size: 6pt)
        #set align(right)
        Приложение 6 к приказу Министра \
        финансов Республики Казахстан от \
        20 декабря 2012 года №562
      ]
    )
  )
  
  v(15pt)
  
  // Organization and BIN section
  grid(
    columns: (auto, 1fr, auto, 140pt),
    column-gutter: 5pt,
    align: (left, center, center),
    
    // Label
    text(size: 9pt)[Организация (индивидуальный предприниматель)],
    
    // Information with underline
    stack(
      v(8pt),
      line(length: 100%, stroke: (thickness: 0.5pt, paint: black)),
      v(-10pt),
      [#data.organizationName],

    ),
    
    h(20pt),
    // БИН box
    rect(
      width: 100%,
      height: 20pt,
      stroke: 0.5pt,
      inset: 2pt
    )[
      #set align(center + horizon)
      #text(size: 9pt)[#data.organizationBin]
    ]
  )
  
  v(5pt)
  
  // Account details section
  grid(
    columns: (auto, 1fr),
    column-gutter: 5pt,
    
    text(size: 9pt)[Доверенность действительна по #formatDate(data.validUntil)],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: (thickness: 0.5pt, paint: black)),
      v(-10pt),
      [#data.organizationAddress],
      v(10pt),
      text(size: 7pt, style: "italic")[
        наименование получателя, ИИН/БИН и его адрес
      ]
    )
  )
  
  
  grid(
    columns: (auto, 1fr),
    column-gutter: 5pt,
    
    
    stack(
      text(size: 9pt)[Счет № #data.accountNumber в АО "Ситибанк Казахстан", БИК CITIKZKA],
            v(5pt),
      line(length: 100%, stroke: (thickness: 0.5pt, paint: black)),
      v(5pt),
      text(size: 7pt, style: "italic")[
        #align(center)[
        наименование банка
      ]
      ]
    )
  )
  
  v(10pt)
  
  // Main title
  align(center)[
    #text(size: 13pt, weight: "bold")[
      ДОВЕРЕННОСТЬ
    ]
  ]
  
  
  align(center)[
    #text(size: 9pt)[
      Дата выдачи #formatDate(data.issueDate)
    ]
  ]
  
  
  // Issued by section
  grid(
    columns: (auto, 1fr),
    column-gutter: 5pt,
    
    text(size: 9pt)[Выдана],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: (thickness: 0.5pt, paint: black)),
      v(-10pt),
      [#data.issuedToRole, #data.issuedToName],
      v(10pt),
      text(size: 7pt, style: "italic")[
        должность, фамилия, имя
      ]
    )
  )
  
  
  // Passport details section
  grid(
    columns: (auto, 1fr),
    column-gutter: 5pt,
    
    text(size: 9pt)[Удостоверение личности (паспорт) серии],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: (thickness: 0.5pt, paint: black)),
      v(-10pt),
      [#data.passportNumber, ИИН #data.issuedToIin, выдан #formatDate(data.passportIssueDate) #data.passportIssuer],
      v(10pt),
      text(size: 7pt, style: "italic")[
        наименование поставщика
      ]
    )
  )
  
  
  // Recipient details section
  grid(
    columns: (auto, 1fr),
    column-gutter: 5pt,
    
    text(size: 9pt)[На получение от #data.supplierName, БИН #data.supplierBin],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: (thickness: 0.5pt, paint: black)),
      v(-10pt),
      [],
      v(10pt),
      text(size: 7pt, style: "italic")[
        наименование поставщика
      ]
    )
  )
  
  
  // Contract details section
  grid(
    columns: (auto, 1fr),
    column-gutter: 5pt,
    
    text(size: 9pt)[активов по #data.contractReference],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: (thickness: 0.5pt, paint: black)),
      v(-10pt),
      [],
      v(10pt),
      text(size: 7pt, style: "italic")[
        наименование, номер и дата документа
      ]
    )
  )
  
  v(15pt)
  
  // Main items table
  let tableData = data.items
  
  table(
    columns: (30pt, 1fr, 60pt, 60pt, 60pt, 80pt),
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
        
        // Column 2: Description
        align(left)[
          #text(size: 8pt)[#item.name]
        ],
        
        // Column 3: Quantity
        align(center)[
          #text(size: 8pt)[#str(item.quantity)]
        ],
        
        // Column 4: Unit
        align(center)[
          #text(size: 8pt)[#item.unit]
        ],
        
        // Column 5: Price
        align(right)[
          #text(size: 8pt)[#formatCurrency(item.price)]
        ],
        
        // Column 6: Total
        align(right)[
          #text(size: 8pt)[#formatCurrency(itemTotal)]
        ]
      )
    }).flatten(),
    
    // Totals row
    [], 
    align(center)[
      #text(size: 8pt, weight: "bold")[ИТОГО:]
    ],
    [],
    [],
    [],
    align(right)[
      #text(size: 8pt, weight: "bold")[#formatCurrency(tableData.fold(0, (sum, item) => sum + item.quantity * item.price))]
    ]
  )
  
  v(25pt)
  
  // Signature section
  grid(
    columns: (auto, 1fr),
    column-gutter: 10pt,
    
    text(size: 9pt)[Подпись лица, получившего доверенность],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: 0.5pt),
      v(-10pt),
      align(center)[
        #text(size: 7pt)[]
      ]
    )
  )
  
  v(25pt)
  
  grid(
    columns: (auto,1fr, 1fr),
    column-gutter: 20pt,
      stack(text(size: 9pt)[удостоверяем:], v(5pt),
      text(size: 9pt)[М.П.],),
    
    // Left side - Organization representative
    stack(
      text(size: 9pt)[Руководитель организации],
      v(5pt),
      text(size: 9pt)[(индивидуальный предприниматель)],
      v(15pt),
      grid(
      columns: (auto,auto,auto,auto,auto,auto),
      column-gutter: 0pt,
      // Title and position
       stack(
          v(12pt),
          line(length: 100%, stroke: 0.5pt),
          v(-15pt),
          align(center)[
            #text(size: 8pt)[]
          ],
           v(15pt),
           align(center)[
            #text(size: 6pt,style: "italic")[Подпись]
          ],
        ),
   
        text(size: 7pt)[/],
     
      // Signature and name section
      
      
      stack(
          v(12pt),
          line(length: 100%, stroke: 0.5pt),
          v(-15pt),
          align(center)[
            #text(size: 8pt)[#data.directorName]
          ],
          v(15pt),
           align(center)[
            #text(size: 6pt,style: "italic")[Расшифровка подписи]
          ],
        )
    ),
    ),
    
    // Right side - Chief accountant
    stack(
      text(size: 9pt)[Главный бухгалтер],
      v(27pt),
      grid(
      columns: (auto,auto,auto,auto,auto,auto),
      column-gutter: 0pt,
      // Title and position
       stack(
          v(12pt),
          line(length: 100%, stroke: 0.5pt),
          v(-15pt),
          align(center)[
            #text(size: 8pt)[]
          ],
           v(15pt),
           align(center)[
            #text(size: 6pt,style: "italic")[Подпись]
          ],
        ),
   
        text(size: 7pt)[/],
     
      // Signature and name section
      
      
      stack(
          v(12pt),
          line(length: 100%, stroke: 0.5pt),
          v(-15pt),
          align(center)[
            #text(size: 8pt)[#data.bookkeeperName]
          ],
          v(15pt),
           align(center)[
            #text(size: 6pt,style: "italic")[Расшифровка подписи]
          ],
        )
    ),
    )
  )
} 