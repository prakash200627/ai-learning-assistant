output "security_group_id" {
  value = aws_security_group.terraform_sg.id
}

output "security_group_name" {
  value = aws_security_group.terraform_sg.name
}

output "instance_id" {
  value = aws_instance.web.id
}

output "instance_public_ip" {
  value = aws_instance.web.public_ip
}