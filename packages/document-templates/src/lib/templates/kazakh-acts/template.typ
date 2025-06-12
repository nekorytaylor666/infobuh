#let main(data) = {
  // Set document properties
  set page(
    paper: "a4",
    margin: (top: 1.5cm, bottom: 1.5cm, left: 1cm, right: 1cm)
  )
  
  set text(
    font: "Helvetica",
    size: 8pt,
    lang: "ru"
  )
  
  set par(leading: 0.4em)
  
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
    let parts = dateStr.split("-")
    if parts.len() != 3 { return dateStr }
    return parts.at(2) + "." + parts.at(1) + "." + parts.at(0)
  }
  
  // Header section with legal references
  grid(
    columns: (1fr, 200pt),
    column-gutter: 10pt,
    
    // Left side - Logo area
    [],
    
   
      // Legal references
      stack(
        spacing: 3pt,
       
        
        rect(
          width: 100%,
          stroke: 0pt,
          inset: 3pt
        )[
          #set text(size: 6pt)
          #set align(right)
          Приложение 50 \
          к приказу Министра финансов \
          Республики Казахстан \
          20 декабря 2012 г. № 562
        ],
        v(15pt),
        
        align(right)[
          #text(size: 10pt, weight: "bold")[Форма Р - 1]
        ]
      ),
      
     
    )
  
  v(15pt)
  
  // Customer and Contractor section
  let participantRow(label, name, address: "", bin: "") = {
    grid(
      columns: (80pt, 1fr, 100pt),
      column-gutter: 5pt,
      
      // Label
      text(weight: "bold")[#label],
      
      // Information with underline
      stack(
        v(8pt),
        line(length: 100%, stroke: (thickness: 0.5pt, paint: black)),
        v(-10pt),
        [#name#if address != "" [, #address]],
    // Subtitle
        v(10pt),
       text(size: 6pt, style: "italic")[
       #h(70pt) полное наименование, адрес, данные о средствах связи
        ]
      ),
      
      // БИН box
      rect(
        width: 100%,
        height: 14pt,
        stroke: 0.5pt,
        inset: 2pt
      )[
        #set align(center + horizon)
        #text(size: 6pt)[#bin]
      ]
    )
    
    v(2pt)
    
    
    v(8pt)
  }
  stack(
    participantRow("Заказчик", data.clientName, bin: data.clientBin),
  participantRow("Исполнитель", data.companyName + ", " + data.at("sellerAddress", default: ""), bin: data.bin),
  
  // Contract section
  grid(
    columns: (1fr, auto),
    column-gutter: 10pt,
    stack(
      grid(
        columns: (auto,1fr),
            column-gutter: 10pt,

    text(weight: "bold")[Договор контракт],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: (thickness: 0.5pt, paint: black)),
      v(-10pt),
      [#data.contractNumber «#formatDate(data.contractDate)» 20__ г.]
    ),
  ),
     // Main title
     v(15pt),
  align(center)[
    #text(size: 8pt, weight: "bold")[
      АКТ ВЫПОЛНЕННЫХ РАБОТ (ОКАЗАННЫХ УСЛУГ)
    ]
  ]),
    // Document info boxes
    grid(
      columns: (90pt, 90pt),
      column-gutter: 5pt,
      
     [
        #stack(
          
           rect(
        width: 100%,
        stroke: 0.5pt
      )[
            #set align(center)
            #text(size: 6pt)[Номер документа]
          ],

          
           rect(
            width: 100%,
            stroke: 0.5pt
          )[
            #set align(center)
            #text(size: 6pt)[#data.actNumber]
          ],
          v(5pt)
        )
      ],
      
     [
        #stack(
          
           rect(
        width: 100%,
        stroke: 0.5pt
      )[
            #set align(center)
            #text(size: 6pt)[Дата составления]
          ],

          
           rect(
            width: 100%,
            stroke: 0.5pt
          )[
            #set align(center)
            #text(size: 6pt)[#data.actDate]
          ],
          v(5pt)
        )
      ],
    )
  )
  
  )
  
 v(5pt)
  
  // Calculate totals from the passed data
  let totalAmount = data.totalAmount
  let vatAmount = data.vatAmount
  let totalInWords = data.totalInWords
  let tableData = data.items

  // Main table
  table(
    
    columns: (40pt, 140pt, 40pt, 100pt, 40pt, 1fr, 1fr, 1fr, 1fr),
    stroke: 0.5pt,
    inset: 6pt,
    
    // Complex header row 1
    table.cell(
      rowspan: 2,
    )[
      #set align(center + horizon)
      #set text(size: 6pt)
      Номер по порядку
    ],
    
    table.cell(
      rowspan: 2,
    )[``
      #set align(center + horizon)
      #set text(size: 6pt)
      Наименование работ (услуг) (в разрезе их подвидов в соответствии с технической спецификацией, заданием, графиком выполнения работ (услуг) при их наличии)			
			
    ],
    
    table.cell(
      rowspan: 2,
    )[
      #set align(center + horizon)
      #set text(size: 6pt)
Дата выполнения работ (оказания услуг)
	    ],
    
    table.cell(
      rowspan: 2,
    )[
      #set align(center + horizon)
      #set text(size: 6pt)
Сведения об отчете о научных исследованиях, маркетинговых, консультационных и прочих услугах (дата, номер, количество страниц) (при их наличии)			
			    ],
    
    table.cell(
      rowspan: 2,
    )[
      #set align(center + horizon)
      #set text(size: 6pt)
      Единица измерения
    ],
    
    table.cell(
      colspan: 4,
      inset: 8pt,
    )[
      #set align(center)
      #set text(size: 6pt)
      Выполнено работ оказано услуг
    ],
    
    // Header row 2 - subheaders
    table.cell( inset: 8pt,align: center)[
      #set align(center)
      #set text(size: 6pt)
      количество
    ],
    
    table.cell(inset: 8pt,)[
      #set align(center)
      #set text(size: 6pt)
      цена за единицу
    ],
    
    table.cell(inset: 8pt,)[
      #set align(center)
      #set text(size: 6pt)
      стоимость
    ],
    
    table.cell(inset: 8pt,)[
      #set align(center)
      #set text(size: 6pt)
      НДС
    ],
    
    ..range(1, 10).map(i => align(center)[#text(size: 6pt)[#str(i)]]),
    
    // Data rows
    ..tableData.enumerate().map(((index, item)) => {
      let itemTotal = item.quantity * item.price
      let itemVat = itemTotal * 0.12
      
      (
        // Column 1: Number
        align(center)[
          #text(size: 6pt)[#str(index + 1)]
        ],
        
        // Column 2: Description
        align(left)[
          #text(size: 6pt)[#item.description]
        ],
        
        // Column 3: Date
        align(center)[
          #text(size: 6pt)[#formatDate(data.dateOfCompletion)]
        ],
        
        // Column 4: Report info (empty)
        align(center)[
          #text(size: 6pt)[]
        ],
        
        // Column 5: Unit
        align(center)[
          #text(size: 6pt)[#item.unit]
        ],
        
        // Column 6: Quantity
        align(center)[
          #text(size: 6pt)[#str(item.quantity)]
        ],
        
        // Column 7: Price
        align(right)[
          #text(size: 6pt)[#formatCurrency(item.price)]
        ],
        
        // Column 8: Total
        align(right)[
          #text(size: 6pt)[#formatCurrency(itemTotal)]
        ],
        
        // Column 9: VAT
        align(right)[
          #text(size: 6pt)[#formatCurrency(itemVat)]
        ]
      )
    }).flatten(),
    
    // Totals row
    [], [], [], [],
    align(center)[
      #text(size: 6pt, weight: "bold")[Итого]
    ],
    align(center)[
      #text(size: 6pt)[#str(tableData.fold(0, (sum, item) => sum + item.quantity))]
    ],
    align(center)[
      #text(size: 6pt)[x]
    ],
    align(right)[
      #text(size: 6pt, weight: "bold")[#formatCurrency(totalAmount)]
    ],
    align(right)[
      #text(size: 6pt, weight: "bold")[#formatCurrency(vatAmount)]
    ]
  )
  
  
  // Signature section
  v(10pt)
  
  // Information about use of records section
  text(size: 7pt, weight: "bold")[Сведения об использовании запасов, полученных от заказчика]
  
  v(5pt)
  
  grid(
    columns: (1fr, 200pt),
    column-gutter: 20pt,
    
    // Left side - empty space for records
    [],
    
    // Right side - name, quantity, cost header
    align(right)[
      #text(size: 6pt, style: "italic")[наименование, количество, стоимость]
    ]
  )
  
  v(10pt)
  
  // Appendix section
  text(size: 7pt)[
    Приложение: Перечень документации, в том числе отчет(ы) о маркетинговых, научных исследованиях, консультационных и прочих услугах (обязательны при его (их) наличии) на 
  ]
  
  // Underline for page count
  box(
    width: 50pt,
    stroke: (bottom: 0.5pt),
  )[
    #h(45pt)
  ]
  
  text(size: 7pt)[ страниц]
  
  v(25pt)
  
  // Signature section
  grid(
    columns: (1fr, 1fr),
    column-gutter: 10pt,
    
    // Executor (Left side)
    grid(
      columns: (auto,auto,auto,auto,auto,auto,auto),
      column-gutter: 0pt,
      // Title and position
      text(size: 6pt, weight: "bold")[Сдал (Исполнитель)],
       stack(
          v(12pt),
          line(length: 100%, stroke: 0.5pt),
          v(-15pt),
          align(center)[
            #text(size: 6pt)[#data.executorPosition]
          ]
        ),
   
        text(size: 7pt)[/],
     
       stack(
          v(12pt),
          line(length: 100%, stroke: 0.5pt),
          v(-10pt),
          align(center)[
            #text(size: 6pt)[]
          ]
        ),
        text(size: 6pt)[/],
        
      // Signature and name section
      
      
      stack(
          v(12pt),
          line(length: 100%, stroke: 0.5pt),
          v(-15pt),
          align(center)[
            #text(size: 6pt)[#data.executorName]
          ]
        )
    ),
    
      // Executor (Left side)
    grid(
      columns: (auto,auto,auto,auto,auto,auto,auto),
      column-gutter: 0pt,
      // Title and position
      text(size: 6pt, weight: "bold")[Принял (Заказчик)],
       stack(
          v(12pt),
          line(length: 100%, stroke: 0.5pt),
          v(-15pt),
          align(center)[
            #text(size: 6pt)[#data.executorPosition]
          ]
        ),
   
        text(size: 7pt)[/],
     
       stack(
          v(12pt),
          line(length: 100%, stroke: 0.5pt),
          v(-10pt),
          align(center)[
            #text(size: 6pt)[]
          ]
        ),
        text(size: 6pt)[/],
        
      // Signature and name section
      
      
      stack(
          v(12pt),
          line(length: 100%, stroke: 0.5pt),
          v(-15pt),
          align(center)[
            #text(size: 6pt)[#data.executorName]
          ]
        )
    ),
  )
  
  v(15pt)
  
  // Date section
  grid(
      columns: (1fr, 1fr),
      column-gutter: 10pt,
      v(0pt),
      grid(
      columns: (auto,1fr),
      column-gutter: 10pt,
      text(size: 6pt,weight: "bold")[Дата подписания (принятия) работ (услуг)],
      
      stack(
        v(8pt),
        line(length: 100%, stroke: 0.5pt),
        v(-10pt),
        align(center)[
          #text(size: 6pt)[#formatDate(data.actDate)]
        ]
      )
    )
  )

  
} 
