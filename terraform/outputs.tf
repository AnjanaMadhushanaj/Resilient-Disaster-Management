output "ec2_public_ip" {
  description = "Public IP of the EC2 instance"
  value       = aws_instance.flood_demo.public_ip
}

output "dashboard_url" {
  description = "Next.js dashboard, reachable on the default HTTP port"
  value       = "http://${aws_instance.flood_demo.public_ip}"
}

output "dashboard_url_alt" {
  description = "Next.js dashboard on the alternate port"
  value       = "http://${aws_instance.flood_demo.public_ip}:3001"
}

output "api_url" {
  description = "Node.js telemetry API base URL"
  value       = "http://${aws_instance.flood_demo.public_ip}:3000"
}

output "ssh_command" {
  description = "SSH command for the instance"
  value       = "ssh -i ~/.ssh/${var.key_name}.pem ubuntu@${aws_instance.flood_demo.public_ip}"
}
