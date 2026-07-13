resource "aws_security_group" "terraform_sg" {
  name        = "terraform-demo-sg"
  description = "Security group created by Terraform"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_instance" "web" {
  ami           = "ami-0f58b397bc5c1f2e8"
  instance_type = var.instance_type
  key_name      = "devops-mumbai"

  vpc_security_group_ids = [
    aws_security_group.terraform_sg.id
  ]

  tags = {
    Name = "terraform-ec2"
  }
}