# 💈 MihaiFade

A full-stack barbershop management and booking platform built with **React, TypeScript, Java, Spring Boot and PostgreSQL**.

## 👨‍💻 About

MihaiFade is a real-world full-stack application developed for my barber and his business, based on his actual requirements and day-to-day workflow.

The platform was built from the ground up to provide a complete digital solution for appointment booking, client and barber management, rewards, promotional campaigns and business administration.

The project was designed and developed by me and is currently being prepared for its official production launch.

## 🌐 Live Website

**Coming soon**

The official `.ro` website will be added here after launch.

## ✨ Features

### 👤 Client

- Account registration and authentication
- Google Sign-In
- Online appointment booking
- Barber and service selection
- Appointment management
- Welcome reward wheel
- Discounts and rewards
- Push notifications and appointment reminders
- Dynamic gallery and barber profiles

### ✂️ Barber

- Dedicated barber dashboard
- Appointment management
- Client reward validation
- Discount validation
- Profile and image management

### 👑 Owner

- Complete administration dashboard
- Barber and service management
- Schedule and time-off management
- Client management
- Gallery management with cloud uploads
- Client activity and visit filtering
- Promotional push notifications
- Dynamic discount campaigns
- Campaign history

## 🛠️ Tech Stack

**Frontend:** React · TypeScript · Vite · CSS

**Backend:** Java 21 · Spring Boot · Spring Security · Spring Data JPA · JWT

**Database:** PostgreSQL

**Integrations:** Google Sign-In · Firebase Cloud Messaging · Cloudinary

**Tools:** Git · GitHub · Postman · Maven

## 🔐 Authentication & Security

The application uses JWT authentication and role-based authorization with three roles:

`CLIENT` · `BARBER` · `OWNER`

Protected backend endpoints are secured using **Spring Security**, while Google Sign-In provides an additional authentication option.

Sensitive credentials and production secrets are managed through environment variables and excluded from version control.

## ☁️ Cloud Integrations

**Firebase Cloud Messaging** handles appointment confirmations, reminders, cancellations and promotional push notifications.

**Cloudinary** handles gallery and barber image storage and delivery.

**Google Sign-In** provides an additional authentication method for clients.

## 🏗️ Architecture

The **React + TypeScript** frontend communicates with a **Java Spring Boot REST API** responsible for business logic, authentication, authorization and database operations.

**PostgreSQL** provides persistent data storage, while Firebase and Cloudinary handle notifications and media storage.

## 🚀 Project Status

**Final testing & production preparation**

The core application is complete. The next steps include final production configuration, deployment and connecting the official `.ro` domain.

## 📄 License

Private project developed for **MihaiFade Barbershop**.

All rights reserved.