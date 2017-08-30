library(shiny)

shinyUI(
  
  fluidPage(
    titlePanel("Real-time clustering (Affinity Propagation)"),
    fluidRow(
    column(12,
      p("Built using R Shiny: https://shiny.rstudio.com/")
    )
    ),
    fluidRow(      
      mainPanel(plotOutput(
          "clusterPlot", "100%", "500px", clickId="clusterClick"
      )),
      sidebarPanel("Heatmap of similarity matrix of data points: ",
                   plotOutput("heatmap"))
    ),
    
    fluidRow(
      mainPanel("Number of Points: ", verbatimTextOutput("numPoints")),
      sidebarPanel(actionButton("clear", "Clear Points"))
    )    
  )
)
