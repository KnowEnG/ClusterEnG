#Download a GEO DataSet and perform clustering, draw heatmap
#April 2017

#install required packages
#source("http://www.bioconductor.org/biocLite.R")
if (!require("RCurl")) {
  install.packages("RCurl", dependencies=T, repos="http://cran.rstudio.com/")
}
if (!require("XML")) {
  install.packages("XML", dependencies=T, repos="http://cran.rstudio.com/")
}
#biocLite("GEOquery")
#biocLite("Biobase")
if (!require("gplots")) {
  install.packages("gplots", dependencies=T, repos="http://cran.rstudio.com/")
}
library(gplots)
library(Biobase)
library(GEOquery)

#input arguments
args <- commandArgs(TRUE)
GEOcode <- as.character(args[1])

setwd("/education/output/")
gds_data <- getGEO(GEOcode, destdir=".")
gds_data <- getGEO(filename=paste(GEOcode, ".soft.gz", sep=""))
eset <- GDS2eSet(gds_data, do.log2=TRUE)
expval <- exprs(eset)
#min <-apply(expval, 1, min)
#max <- apply(expval, 1, max)
var <- apply(expval, 1, var)
redExpVal <- expval[order(var, decreasing=TRUE),][1:500,]
id.col <- c(1:500)
combine.cols <- cbind(ID = id.col, redExpVal)
write.table(combine.cols, file="heatmap_vals.csv", sep = ",", row.names = FALSE, col.names = TRUE)
write.table(rownames(redExpVal), file="heatmap_rownames.csv", sep = ",", row.names = FALSE, col.names = FALSE)
write.table(colnames(redExpVal), file="heatmap_colnames.csv", sep = ",", row.names = FALSE, col.names = FALSE)
system("python /heatmap/inchlib_clust-0.1.4/build/lib.linux-x86_64-2.7/inchlib_clust.py /education/output/heatmap_vals.csv -dh -a both -o /education/output/heatmap_vals.json -mv NA > /error.log")
print(read.table("/error.log"))

#create heatmap and save it as png file
#png(paste(GEOcode, ".heatmap.png", sep=""), width=800, height=1200)
#heatmap.2(redExpVal, col=redgreen(75), scale="row", density.info="none", trace="none", cexRow=1, cexCol=1, labRow="", key=FALSE, margins=c(6,2), srtCol=45)
#dev.off()
