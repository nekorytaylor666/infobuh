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
    
    // Left side - Organization info
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
        Приложение 26 \
        к приказу Министра финансов \
        Республики Казахстан \
        от 20 декабря 2012 года № 562
      ],
      
      v(15pt),
      
      align(right)[
        #text(size: 10pt, weight: "bold")[Форма 3-2]
      ]
    )
  )
  
  v(10pt)
  grid(
      columns: (auto, 1fr,auto, 140pt),
      column-gutter: 5pt,
      align: (left,center, center),
      
      // Label
      text(size: 6pt)[Организация\ (Индивидиуальный предприниматель)],
      
      // Information with underline
      stack(
        v(8pt),
        line(length: 100%, stroke: (thickness: 0.5pt, paint: black)),
        v(-10pt),
        [ТОО "COMABOOKSS", Г.АСТАНА, РАЙОН АЛМАТЫ ],
    // Subtitle
        v(10pt),
       text(size: 6pt, style: "italic")[
        наименование, адрес, данные о средствах связи
        ]
      ),
      h(20pt),
      // БИН box
      grid(
        columns: (auto,1fr),
        column-gutter: 4pt,
        
        [
          #v(2pt)
          ИИН/БИН
        ],
      rect(
        width: 100%,
        height: 10pt,
        stroke: 0.5pt,
        inset: 2pt
      )[
        #set align(center + horizon)
        #text(size: 8pt)[001123550090]
      ]),
    )
  
  // Document number and date section
    grid(
      columns: (1fr,50pt,50pt),
      column-gutter: 0pt,
      [],
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
            #text(size: 6pt)[12.12.2000]
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
            #text(size: 6pt)[12.12.2000]
          ],
          v(5pt)
        )
      ],
    )
  
  v(15pt)
  
  // Main title
  align(center)[
    #text(size: 10pt, weight: "bold")[
      НАКЛАДНАЯ НА ОТПУСК ЗАПАСОВ НА СТОРОНУ
    ]
  ]
  
  v(10pt)
  
  // Organizations section
  // Organizations section table
table(
  columns: (1fr, 1fr, 1fr, 1fr, 1fr),
  stroke: 0.5pt,
  inset: 6pt,
  
  // Header row
  table.cell()[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Организация (индивидуальный предприниматель) - отправитель
  ],
  
  table.cell()[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Организация (индивидуальный предприниматель) - получатель
  ],
  
  table.cell()[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Ответственный за поставку (Ф.И.О.)
  ],
  
  table.cell()[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Транспортная организация
  ],
  
  table.cell()[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Товарно-транспортная накладная (номер, дата)
  ],
  
  // Data row
  table.cell()[
    #set align(center + horizon)
    #set text(size: 6pt)
    #data.sellerName
  ],
  
  table.cell()[
    #set align(center + horizon)
    #set text(size: 6pt)
    #data.receiverName
  ],
  
  table.cell()[
    #set align(center + horizon)
    #set text(size: 6pt)
    #data.at("responsiblePersonName", default: "")
  ],
  
  table.cell()[
    #set align(center + horizon)
    #set text(size: 6pt)
    #data.at("transportOrgName", default: "")
  ],
  
  table.cell()[
    #set align(center + horizon)
    #set text(size: 6pt)
    #data.at("transportWaybillInfo", default: "")
  ]
)
  
  v(10pt)
  
  // Main items table
  let totalAmount = data.totalAmount
  let vatAmount = data.vatAmount
  let totalInWords = data.totalInWords
  let tableData = data.items
  
  // Main items table with 2-row header
table(
  columns: (30pt, 120pt, 60pt, 40pt, 50pt, 50pt, 1fr, 1fr, 1fr),
  stroke: 0.5pt,
  inset: 4pt,
  
  // Header row 1
  table.cell(
    rowspan: 2,
  )[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Номер по порядку
  ],
  
  table.cell(
    rowspan: 2,
  )[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Наименование, характеристика
  ],
  
  table.cell(
    rowspan: 2,
  )[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Номенклатурный номер
  ],
  
  table.cell(
    rowspan: 2,
  )[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Единица измерения
  ],
  
  table.cell(
    colspan: 2,
  )[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Количество
  ],
  
  table.cell(
    rowspan: 2,
  )[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Цена за единицу, в КЗТ
  ],
  
  table.cell(
    rowspan: 2,
  )[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Сумма с НДС, в КЗТ
  ],
  
  table.cell(
    rowspan: 2,
  )[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    Сумма НДС, в КЗТ
  ],
  
  // Header row 2 - only for quantity sub-columns
  table.cell()[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    подлежит отпуску
  ],
  
  table.cell()[
    #set align(center + horizon)
    #set text(size: 6pt, weight: "bold")
    отпущено
  ],
  
  // Column numbers row
  ..range(1, 10).map(i => align(center)[#text(size: 6pt)[#str(i)]]),
  
  // Data rows
  ..tableData.enumerate().map(((index, item)) => {
    let itemTotalWithVat = item.quantity * item.price * 1.12
    let itemVat = item.quantity * item.price * 0.12
    
    (
      // Column 1: Number
      align(center)[
        #text(size: 6pt)[#str(index + 1)]
      ],
      
      // Column 2: Description
      align(left)[
        #text(size: 6pt)[#item.description]
      ],
      
      // Column 3: Nomenclature code
      align(center)[
        #text(size: 6pt)[#item.at("nomenclatureCode", default: "")]
      ],
      
      // Column 4: Unit
      align(center)[
        #text(size: 6pt)[#item.unit]
      ],
      
      // Column 5: Quantity to be released
      align(center)[
        #text(size: 6pt)[#str(item.quantity)]
      ],
      
      // Column 6: Quantity released
      align(center)[
        #text(size: 6pt)[#str(item.quantity)]
      ],
      
      // Column 7: Price per unit
      align(right)[
        #text(size: 6pt)[#formatCurrency(item.price)]
      ],
      
      // Column 8: Amount with VAT
      align(right)[
        #text(size: 6pt)[#formatCurrency(itemTotalWithVat)]
      ],
      
      // Column 9: VAT amount
      align(right)[
        #text(size: 6pt)[#formatCurrency(itemVat)]
      ]
    )
  }).flatten(),
  
  // Totals row
  [], 
  align(center)[
    #text(size: 6pt, weight: "bold")[Итого]
  ],
  [],
  [],
  align(center)[
    #text(size: 6pt, weight: "bold")[#str(tableData.fold(0, (sum, item) => sum + item.quantity))]
  ],
  align(center)[
    #text(size: 6pt, weight: "bold")[#str(tableData.fold(0, (sum, item) => sum + item.quantity))]
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
  
  v(10pt)
  
  // Total summary section
  grid(
    columns: (auto, 1fr, auto, 80pt),
    column-gutter: 5pt,
    
    text(size: 7pt)[Всего отпущено количество запасов (прописью), в ],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: 0.5pt),
      v(-10pt),
      align(center)[
        #text(size: 6pt)[#data.at("unitDescription", default: "")]
      ]
    ),
    
    text(size: 7pt)[на сумму (прописью), в КЗТ],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: 0.5pt),
      v(-10pt),
      align(center)[
        #text(size: 6pt)[#totalInWords]
      ]
    )
  )
  
  v(15pt)
  
  // Release approval section
  grid(
    columns: (auto, 1fr, auto, 1fr),
    column-gutter: 10pt,
    
    text(size: 7pt)[Отпуск разрешил],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: 0.5pt),
      v(-10pt),
      align(center)[
        #text(size: 6pt)[#data.at("releaserEmployeeName", default: "")]
      ]
    ),
    
    text(size: 7pt)[По доверенности №],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: 0.5pt),
      v(-10pt),
      align(center)[
        #text(size: 6pt)[]
      ]
    )
  )
  
  v(5pt)
  
  align(center)[
    #text(size: 6pt, style: "italic")[должность, расшифровка подписи]
  ]
  
  v(10pt)
  
  grid(
    columns: (auto, 1fr, auto, 1fr),
    column-gutter: 10pt,
    
    text(size: 7pt)[выданной],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: 0.5pt),
      v(-10pt),
      align(center)[
        #text(size: 6pt)[]
      ]
    ),
    
    text(size: 7pt)[года],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: 0.5pt),
      v(-10pt),
      align(center)[
        #text(size: 6pt)[]
      ]
    )
  )
  
  v(15pt)
  
  // Chief accountant section
  grid(
    columns: (auto, 1fr),
    column-gutter: 10pt,
    
    text(size: 7pt)[Главный бухгалтер],
    
    stack(
      v(8pt),
      line(length: 100%, stroke: 0.5pt),
      v(-10pt),
      align(center)[
        #text(size: 6pt)[#data.at("chiefAccountantName", default: "")]
      ]
    )
  )
  
  v(5pt)
  
  align(center)[
    #text(size: 6pt, style: "italic")[расшифровка подписи]
  ]
  
  v(15pt)
  
  // Release and receipt section
  grid(
    columns: (1fr, 1fr),
    column-gutter: 20pt,
    
    // Released section
    stack(
      v(-10pt),
      text(size: 7pt)[М.П.],
      v(5pt),
      text(size: 7pt)[Отпустил],
      
      stack(
        v(8pt),
        line(length: 100%, stroke: 0.5pt),
        v(-10pt),
        align(center)[
          #text(size: 6pt)[#data.at("releaserEmployeeName", default: "")]
        ]
      ),
      
      v(10pt),
      
      align(center)[
        #text(size: 6pt, style: "italic")[расшифровка подписи]
      ]
    ),
    
    // Received section  
    stack(
      text(size: 7pt)[Заказы получил],
      
      stack(
        v(8pt),
        line(length: 100%, stroke: 0.5pt),
        v(-10pt),
        align(center)[
          #text(size: 6pt)[#data.at("receiverEmployeeName", default: "")]
        ]
      ),
      
      v(10pt),
      
      align(center)[
        #text(size: 6pt, style: "italic")[расшифровка подписи]
      ],
      
      v(10pt),
      
      align(right)[
        #formatDate(data.waybillDate)
      ]
    )
  )
} 