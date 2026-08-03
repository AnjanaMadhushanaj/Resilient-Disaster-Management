# Resilient Edge-Cloud Architecture for Intelligent Disaster Management

## Project Overview
This repository contains the source code for the IT41043 Intelligent Systems module project. The proposed system aims to provide a resilient, edge-cloud based early warning and disaster management framework for resource-constrained environments (specifically in Sri Lanka).

## System Architecture
The system integrates:
- Real-time CCTV flood monitoring using **YOLOv8**
- **Edge computing** for localized data processing (Wi-Fi/BLE sniffing)
- **Node.js/Next.js** for real-time dashboards and MLOps automation
- **2G-USSD/SMS Gateways** for offline communication during infrastructure blackouts

## Repository Structure
- `preprocessing.py`: Contains automated scripts for resizing video frames to 640x640 and applying OpenCV Gaussian blur for PII anonymization.
- `requirements.txt`: Python dependencies required for the ML pipeline.

*(Note: This repository is currently in the Milestone 2 stage. Full microservices implementation will be pushed in upcoming milestones.)*