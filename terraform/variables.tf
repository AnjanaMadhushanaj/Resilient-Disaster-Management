variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "ap-south-1" # Mumbai, the closest region to Sri Lanka
}

variable "project_name" {
  description = "Name applied to the instance and security group"
  type        = string
  default     = "flood-detection-demo"
}

variable "instance_type" {
  description = "EC2 instance type. t2.micro is free-tier eligible."
  type        = string
  default     = "t2.micro"
}

variable "key_name" {
  description = "Name of an existing EC2 key pair for SSH access. Must already exist in the target region."
  type        = string
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to reach port 22. Narrow this to your own IP (e.g. 203.0.113.4/32) outside of a throwaway demo."
  type        = string
  default     = "0.0.0.0/0"
}

variable "root_volume_size" {
  description = "Root EBS volume size in GB"
  type        = number
  default     = 20
}
