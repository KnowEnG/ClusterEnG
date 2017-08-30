#!/usr/bin/env Rscript

library(data.table)
library(pryr)
options(stringsAsFactors = FALSE)

#input arguments
args <- commandArgs(TRUE)
algoName <- args[1]
num <- as.integer(args[2])
cluster.by <- args[3]
is.row.names <- args[4]
file.name <- args[5]
dbscan.eps <- as.numeric(args[6])
if (is.na(cluster.by))
  cluster.by <- "columns"
  
input.start <- Sys.time()
print(paste0("/education/input/files/", file.name))
data.orig <- fread(paste0("/education/input/files/", file.name), sep = "auto", data.table = FALSE, na.strings = c("NA", "N/A", "?"))
input.time <- Sys.time() - as.numeric(input.start, units = "secs")
data.orig.mod <- data.orig

if (is.row.names == "yes" | class(data.frame(data.orig)[, 1]) != "numeric") {
  data.orig.mod <- data.orig[, 2:ncol(data.orig)]
  rownames(data.orig.mod) <- data.orig[, 1]
  print("Inside rownames, check.")
}
if (cluster.by == "rows") {
  data.orig.mod <- t(data.orig.mod)
}
rm(data.orig)

print("Computing principal components...")
data <- na.omit(data.orig.mod)
rm(data.orig.mod)
pca.start <- Sys.time()
pca <- prcomp(as.matrix(t(data)))
pca.time <- Sys.time() - as.numeric(pca.start, units = "secs")
fullDataPCA <- pca$x
rm(pca)
fullData <- as.matrix(t(data))
# if (ncol(fullData) == 2) {
#   colnames(fullData)[1:2] <- c("PC1", "PC2")
# } else {
#   colnames(fullData)[1:3] <- c("PC1", "PC2", "PC3")
# }

print("Algorithm running...")
algo.start <- Sys.time()
numClusters <- num
if (algoName == "kmeans") {
  if (!require("cluster")) {
    install.packages("cluster")
  }
  library(cluster)
  fit <- kmeans(fullData, numClusters, nstart = 1)
  mydata <- as.data.frame(fit$cluster)
}
if (algoName == "kmedoids") {
  if (!require("cluster")) {
    install.packages("cluster")
  }
  library(cluster)
  fit <- pam(fullData, numClusters)
  mydata <- as.data.frame(fit$cluster)
}
if (algoName == "AP") {
  if (!require("apcluster")) {
    install.packages("apcluster")
  }
  if (!require("methods")) {
    install.packages("methods")
  }
  library(apcluster)
  library(methods)
  if (!is.na(num)) {
    fit <- apclusterK(negDistMat(r=2), fullDataPCA, K = numClusters)
  } else {
    fit <- apcluster(negDistMat(r=2), fullDataPCA)
  }
  mydata <- as.data.frame(labels(fit, type="enum"))
}
if (algoName == "SC") {
  if (!require("kernlab")) {
    install.packages("kernlab")
  }
  library(kernlab)
  fit <- specc(data.matrix(fullData), centers = numClusters)
  mydata <- as.data.frame(fit[1:nrow(fullData)])
}
if (algoName == "GM") {
  if (!require("mclust")) {
    install.packages("mclust") 
  }
  library(mclust)
  fit <- Mclust(fullDataPCA, G = numClusters)
  mydata <- as.data.frame(fit$classification)
}

if (algoName == "hierarchical") {
  fit <- hclust(dist(fullData), method = "complete")
  mydata <- as.data.frame(cutree(fit, numClusters))
}
if (algoName == "dbscan") {
  if (!require("dbscan")) {
    install.packages("dbscan") 
  }
  library(dbscan)
  fit <- dbscan(fullData, eps = dbscan.eps, minPts = 2)
  if ("0" %in% fit$cluster) {
    mydata <- as.data.frame(fit$cluster + 1L)
  } else {
    mydata <- as.data.frame(fit$cluster)
  } 
}
algo.time <- Sys.time() - as.numeric(algo.start, units = "secs")
rm(fit)

if (algoName == "dbscan-est") {
  if (!require("dbscan")) {
    install.packages("dbscan") 
  }
  library(dbscan)
  print("Calculating k-nearest neighbors distance...")
  knn.dist <- kNNdist(fullData, k = 2)
  temp <- sort(as.numeric(knn.dist))
  N <- length(temp)
  print("Plotting graph...")
  png("/education/output/dbscan_knn_plot.png")
  plot(1:N, temp, xlab = "Points sorted by distance", ylab = "2-nearest neighbors distance")
  dev.off()
  Bvec <- c(N, temp[N])
  fl <- floor(0.2*N)
  Avec <- c(1, temp[1])
  i <- 1
  dists <- sapply(1:N, function(p){
    BAnorm <- (Avec - Bvec)/sqrt(sum((Bvec - Avec) ^ 2))
    pvec <- c(i, temp[i])
    dist <- sqrt(sum((pvec - (sum(pvec*BAnorm)*(BAnorm))) ^ 2))
    i <<- i + 1
    dist
  })
  eps.est.min <- round(temp[which.max(dists)], digits = 3)
  
  slope <- predict(smooth.spline(1:N, temp), 1:N, 1)
  sec <- predict(smooth.spline(1:N, slope$y), 1:N, 1)
  ext.point <- which(diff(sign(diff(sec$y)))==-2)+1
  #ext.point2 <- which(diff(sign(diff(sec$y)))==2)+1
  eps.est.max <- round(temp[ext.point[length(ext.point)]], digits = 3)
  #eps.est2 <- round(temp[ext.point2[length(ext.point2)]], digits = 2)
  write.table(paste(eps.est.min, "-", eps.est.max, sep = ""), "/education/output/output_dbscan_eps_est.txt", col.names = F, row.names = F, quote = F)
} else {
  print("Writing files...")
  output.start <- Sys.time()
  colnames(mydata) <- c("cluster")
  sample <- as.data.frame(rownames(as.data.frame(fullData)))
  colnames(sample) <- c("sample")
  filename <- paste("/education/output/output_", algoName, "_annot.csv", sep="")
  write.table(cbind(sample, mydata), file=filename, sep = ",", row.names = FALSE)
  
  combinedData <- cbind(fullDataPCA, mydata)
  filename <- paste("/education/output/output_", algoName, "_PC.csv", sep="")
  write.table(combinedData, file=filename, sep = ",", row.names = FALSE)
  ids <- as.data.frame(0:(nrow(combinedData)-1))
  rm(combinedData)
  colnames(ids) <- c("ID")
  finalData <- cbind(ids, sample, fullDataPCA, mydata)
  filename <- paste("/education/output/output_", algoName, "_full.csv", sep="")
  write.table(finalData, file = filename, sep = ",", row.names = FALSE)
  rm(finalData)
  input.output.time <- Sys.time() - as.numeric(output.start, units = "secs") + as.numeric(input.time, units = "secs")
  memory.used <- mem_used()/1e6
  benchmark.result <- t(data.frame(c(Time = as.character(Sys.time()), File = file.name, Algorithm = algoName, Cluster_by = cluster.by, IO_Time = input.output.time, PCA_Time = pca.time, Algorithm_Time = algo.time, Memory_used_MB = as.character(memory.used))))
  write.table(benchmark.result, file = "/code/benchmark.txt", sep = "\t", row.names = FALSE, col.names = FALSE, append = TRUE, quote = FALSE)
  print(paste("Memory used (MB) = ", memory.used))
}
print(algoName);
