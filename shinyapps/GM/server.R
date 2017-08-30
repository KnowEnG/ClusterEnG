library(shiny)
library(mclust)

shinyServer(function(input, output, session) {
  
  val <- reactiveValues(x=NULL, y=NULL)    
  
  observe({
    if (is.null(input$clusterClick)){
      return()
    }
    isolate({
      val$x <- c(val$x, input$clusterClick$x)
      val$y <- c(val$y, input$clusterClick$y)
    })
  })
  output$numPoints <- renderText({
    length(val$x)
  })
  observe({
    if (input$clear > 0){
      val$x <- NULL
      val$y <- NULL
    }
  })
  
  output$clusterPlot <- renderPlot({
    
    tryCatch({
      data <- matrix(c(val$x, val$y), ncol=2)
      
      if (length(val$x) <= 1){
        stop("Add more points to cluster")
      } 
      suppressWarnings({
        fit <- Mclust(data)
      })
      output$summary <- renderTable({
        a <- summary(fit)
        centroids <- data.frame(a$mean)
        rownames(centroids) <- c("X", "Y")
        centroids
      })
      
      output$heatmap <- renderPlot({
      par(mar = c(5, 5, 2, 2))
      heatmap(as.matrix(dist(data)), col = cm.colors(256), margins = c(3,3), xlab = "Point", ylab =  "Point", Colv = F, Rowv = F, cexRow = 2, cexCol = 2, cex.lab = 2)
      })
      par(mar = c(5, 5, 2, 2))
      mclust2Dplot(data = data, what = "classification", 
                   classification = fit$classification, identify = FALSE, 
                   xlim=c(-2,2), ylim=c(-2,2), xlab="X", ylab="Y", cex.lab = 2, cex.axis = 2)
    }, error=function(warn){
      par(mar = c(5, 5, 2, 2))
      plot(val$x, val$y, xlim=c(-2, 2), ylim=c(-2, 2), xlab="X", ylab="Y", cex.lab = 2, cex.axis = 2)
      text(0, 0, "Click to add more points.")
    })
  })
})
