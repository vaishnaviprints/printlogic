# Terraform Configuration for Multi-Cloud Deployment
# Works with AWS, Azure, and Google Cloud

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

# Variables
variable "project_name" {
  description = "Project name"
  default     = "vaishnavi-printers"
}

variable "environment" {
  description = "Environment (production/staging)"
  default     = "production"
}

variable "cloud_provider" {
  description = "Cloud provider (aws/azure/gcp)"
  type        = string
}

variable "region" {
  description = "Cloud region"
  type        = string
  default     = "ap-south-1"  # Mumbai for AWS
}

variable "mongodb_connection_string" {
  description = "MongoDB Atlas connection string"
  type        = string
  sensitive   = true
}

variable "jwt_secret_key" {
  description = "JWT secret key"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Custom domain name"
  type        = string
  default     = "vaishnaviprinters.com"
}

# Outputs
output "frontend_url" {
  description = "Frontend application URL"
  value       = var.cloud_provider == "aws" ? module.aws[0].frontend_url : var.cloud_provider == "azure" ? module.azure[0].frontend_url : module.gcp[0].frontend_url
}

output "backend_url" {
  description = "Backend API URL"
  value       = var.cloud_provider == "aws" ? module.aws[0].backend_url : var.cloud_provider == "azure" ? module.azure[0].backend_url : module.gcp[0].backend_url
}

output "deployment_info" {
  description = "Deployment information"
  value = {
    cloud_provider = var.cloud_provider
    region         = var.region
    environment    = var.environment
    project_name   = var.project_name
  }
}

# AWS Module
module "aws" {
  count  = var.cloud_provider == "aws" ? 1 : 0
  source = "./modules/aws"
  
  project_name              = var.project_name
  environment               = var.environment
  region                    = var.region
  mongodb_connection_string = var.mongodb_connection_string
  jwt_secret_key            = var.jwt_secret_key
  domain_name               = var.domain_name
}

# Azure Module
module "azure" {
  count  = var.cloud_provider == "azure" ? 1 : 0
  source = "./modules/azure"
  
  project_name              = var.project_name
  environment               = var.environment
  location                  = "centralindia"
  mongodb_connection_string = var.mongodb_connection_string
  jwt_secret_key            = var.jwt_secret_key
  domain_name               = var.domain_name
}

# GCP Module
module "gcp" {
  count  = var.cloud_provider == "gcp" ? 1 : 0
  source = "./modules/gcp"
  
  project_name              = var.project_name
  environment               = var.environment
  region                    = "asia-south1"
  mongodb_connection_string = var.mongodb_connection_string
  jwt_secret_key            = var.jwt_secret_key
  domain_name               = var.domain_name
}