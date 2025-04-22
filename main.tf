terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1" # Change to your desired region
}

# --- Network Configuration (Using Default VPC) ---
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# --- Security Groups ---
resource "aws_security_group" "alb_sg" {
  name        = "alb-sg"
  description = "Allow HTTP/HTTPS traffic to ALB"
  vpc_id      = data.aws_vpc.default.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "alb-sg"
  }
}

resource "aws_security_group" "ec2_sg" {
  name        = "ec2-sg"
  description = "Allow traffic from ALB and SSH"
  vpc_id      = data.aws_vpc.default.id

  # Allow traffic from the ALB security group (adjust port if your app uses something else)
  ingress {
    from_port       = 80 # Assuming your app runs on port 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  # Allow SSH from anywhere (Restrict this in production!)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }


  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "ec2-sg"
  }
}


# --- EC2 Instance ---
# Find the latest Amazon Linux 2 AMI
data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "web_server" {
  ami           = data.aws_ami.amazon_linux_2.id
  instance_type = "t2.medium" # As requested
  subnet_id     = data.aws_subnets.default.ids[0] # Use the first default subnet
  vpc_security_group_ids = [aws_security_group.ec2_sg.id]

  # Optional: Add user data to install a web server, e.g., Apache
  # user_data = <<-EOF
  #           #!/bin/bash
  #           yum update -y
  #           yum install -y httpd
  #           systemctl start httpd
  #           systemctl enable httpd
  #           echo "<h1>Deployed via Terraform</h1>" > /var/www/html/index.html
  #           EOF

  tags = {
    Name = "web-server-instance"
  }
}

# --- Application Load Balancer (ALB) ---
resource "aws_lb" "main_alb" {
  name               = "main-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = data.aws_subnets.default.ids # Attach ALB to all default subnets for high availability

  enable_deletion_protection = false # Set to true in production

  tags = {
    Name = "main-alb"
  }
}

# --- Target Group ---
resource "aws_lb_target_group" "web_tg" {
  name        = "web-target-group"
  port        = 80 # Port your application listens on within the EC2 instance
  protocol    = "HTTP"
  vpc_id      = data.aws_vpc.default.id
  target_type = "instance" # Can also be 'ip' or 'lambda'

  health_check {
    path                = "/" # Path for health checks
    protocol            = "HTTP"
    matcher             = "200" # Expected HTTP status code for healthy instances
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 2
  }

  tags = {
    Name = "web-target-group"
  }
}

# --- Attach EC2 Instance to Target Group ---
resource "aws_lb_target_group_attachment" "web_tg_attachment" {
  target_group_arn = aws_lb_target_group.web_tg.arn
  target_id        = aws_instance.web_server.id
  port             = 80 # Port the target group should forward traffic to on the instance
}

# --- ALB Listener ---
resource "aws_lb_listener" "http_listener" {
  load_balancer_arn = aws_lb.main_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_tg.arn
  }
}

# --- Outputs ---
output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main_alb.dns_name
}

output "instance_public_ip" {
  description = "Public IP address of the EC2 instance (primarily for SSH)"
  value       = aws_instance.web_server.public_ip # Note: This IP might change on stop/start
} 