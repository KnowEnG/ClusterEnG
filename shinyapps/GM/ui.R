library(shiny)

shinyUI(
    fluidPage(
    
    titlePanel("Real-time clustering (Gaussian Mixture Model)"),
    fluidRow(
    column(12,
      p("Built using R Shiny: https://shiny.rstudio.com/")
    )
    ),
    fluidRow(
      
      mainPanel(plotOutput(
          "clusterPlot", "100%", "500px", clickId="clusterClick"
      )),
      sidebarPanel("Centroid of clusters (labeled X1, X2, ...): ", tableOutput("summary")
      ,
                   plotOutput("heatmap"))
    ),
    
    fluidRow(
      mainPanel("Number of points: ", verbatimTextOutput("numPoints")),
      sidebarPanel(actionButton("clear", "Clear Points"))
    )
  )
)