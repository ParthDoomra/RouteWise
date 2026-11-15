"""Database Seeding Script for RouteWise.

Populates PostgreSQL with realistic Bengaluru fleet, driver, order, and maintenance
data matching the RouteWise frontend mock data.

Features:
- Completely idempotent (safe to run multiple times without duplicating data).
- Uses bcrypt to hash all manager and driver passwords.
- Enforces strict separation between manager credentials and driver credentials.
- Prints exact table row counts and demo credentials upon completion.
"""

import datetime
import os
import sys
from pathlib import Path
from typing import Dict

# Ensure backend directory is in sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

import bcrypt
from sqlalchemy import func

from app.database import Base, SessionLocal, engine
from app.models import (
    Driver,
    DriverLogin,
    MaintenanceTicket,
    Manager,
    Notification,
    Order,
    Route,
    RouteStop,
    Vehicle,
)


def hash_password(password: str) -> str:
    """Generate a secure bcrypt hash for a plaintext password or PIN."""
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def seed_database() -> Dict[str, int]:
    """Execute idempotent database seed and return table row counts."""
    # Ensure all tables exist in the PostgreSQL database
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # =====================================================================
        # 1. Managers (Dedicated Manager Credentials)
        # =====================================================================
        manager_email = "manager@routewise.com"
        existing_manager = db.query(Manager).filter(Manager.email == manager_email).first()
        if not existing_manager:
            manager = Manager(
                name="Fleet Operations Manager",
                email=manager_email,
                password_hash=hash_password("manager123"),
            )
            db.add(manager)
            db.commit()

        # =====================================================================
        # 2. Vehicles (~10 Vehicles matching Frontend assets)
        # =====================================================================
        vehicles_data = [
            {
                "plate_no": "KA-01-EA-1024",
                "model": "Tata Ace Gold EV",
                "capacity_kg": 650.0,
                "status": "available",
                "current_lat": 12.9716,
                "current_lng": 77.5946,
                "mileage_km": 14250.0,
                "last_service_date": datetime.date(2026, 9, 15),
            },
            {
                "plate_no": "KA-01-GB-5091",
                "model": "Mahindra Bolero Maxi Truck",
                "capacity_kg": 1200.0,
                "status": "delayed",
                "current_lat": 12.9352,
                "current_lng": 77.6245,
                "mileage_km": 28100.0,
                "last_service_date": datetime.date(2026, 8, 20),
            },
            {
                "plate_no": "KA-05-MC-8812",
                "model": "Euler Motors HiLoad EV",
                "capacity_kg": 688.0,
                "status": "available",
                "current_lat": 12.9308,
                "current_lng": 77.5838,
                "mileage_km": 9840.0,
                "last_service_date": datetime.date(2026, 10, 1),
            },
            {
                "plate_no": "KA-03-HA-3301",
                "model": "Maruti Suzuki Eeco Cargo",
                "capacity_kg": 500.0,
                "status": "available",
                "current_lat": 12.9781,
                "current_lng": 77.5695,
                "mileage_km": 31500.0,
                "last_service_date": datetime.date(2026, 7, 10),
            },
            {
                "plate_no": "KA-04-MH-9920",
                "model": "Eicher Pro 2049 Light Truck",
                "capacity_kg": 2400.0,
                "status": "maintenance",
                "current_lat": 12.9900,
                "current_lng": 77.5520,
                "mileage_km": 45200.0,
                "last_service_date": datetime.date(2026, 6, 5),
            },
            {
                "plate_no": "KA-02-JL-4411",
                "model": "Ather 450X Commercial EV",
                "capacity_kg": 120.0,
                "status": "available",
                "current_lat": 12.9756,
                "current_lng": 77.6066,
                "mileage_km": 6200.0,
                "last_service_date": datetime.date(2026, 10, 12),
            },
            {
                "plate_no": "KA-01-MK-7722",
                "model": "Ashok Leyland Bada Dost",
                "capacity_kg": 1850.0,
                "status": "available",
                "current_lat": 12.9116,
                "current_lng": 77.6389,
                "mileage_km": 21000.0,
                "last_service_date": datetime.date(2026, 8, 30),
            },
            {
                "plate_no": "KA-05-PQ-3390",
                "model": "Piaggio Ape E-City",
                "capacity_kg": 400.0,
                "status": "available",
                "current_lat": 12.9863,
                "current_lng": 77.7308,
                "mileage_km": 8900.0,
                "last_service_date": datetime.date(2026, 9, 25),
            },
            {
                "plate_no": "KA-03-TR-6614",
                "model": "Tata Intra V30 Smart",
                "capacity_kg": 1300.0,
                "status": "available",
                "current_lat": 12.8452,
                "current_lng": 77.6602,
                "mileage_km": 17500.0,
                "last_service_date": datetime.date(2026, 7, 18),
            },
            {
                "plate_no": "KA-02-BN-8833",
                "model": "Mahindra Treo Zor EV",
                "capacity_kg": 550.0,
                "status": "available",
                "current_lat": 12.9719,
                "current_lng": 77.6412,
                "mileage_km": 11400.0,
                "last_service_date": datetime.date(2026, 9, 10),
            },
        ]

        vehicle_map = {}
        for vdata in vehicles_data:
            veh = db.query(Vehicle).filter(Vehicle.plate_no == vdata["plate_no"]).first()
            if not veh:
                veh = Vehicle(**vdata)
                db.add(veh)
                db.commit()
                db.refresh(veh)
            vehicle_map[vdata["plate_no"]] = veh

        # =====================================================================
        # 3. Drivers & Dedicated Driver Logins
        # =====================================================================
        drivers_data = [
            {
                "name": "Rahul Sharma",
                "phone": "+91 98450 11223",
                "pin": "1024",
                "vehicle_plate": "KA-01-EA-1024",
                "shift_start": datetime.time(8, 0),
                "shift_end": datetime.time(17, 0),
            },
            {
                "name": "Priya Nair",
                "phone": "+91 99011 44556",
                "pin": "5091",
                "vehicle_plate": "KA-01-GB-5091",
                "shift_start": datetime.time(9, 0),
                "shift_end": datetime.time(18, 0),
            },
            {
                "name": "Amit Patel",
                "phone": "+91 97400 88990",
                "pin": "8812",
                "vehicle_plate": "KA-05-MC-8812",
                "shift_start": datetime.time(8, 30),
                "shift_end": datetime.time(17, 30),
            },
            {
                "name": "Vikram Singh",
                "phone": "+91 98800 22331",
                "pin": "3301",
                "vehicle_plate": "KA-03-HA-3301",
                "shift_start": datetime.time(9, 0),
                "shift_end": datetime.time(18, 0),
            },
        ]

        for ddata in drivers_data:
            drv = db.query(Driver).filter(Driver.phone == ddata["phone"]).first()
            assigned_veh = vehicle_map.get(ddata["vehicle_plate"])
            if not drv:
                drv = Driver(
                    name=ddata["name"],
                    phone=ddata["phone"],
                    vehicle_id=assigned_veh.id if assigned_veh else None,
                    shift_start=ddata["shift_start"],
                    shift_end=ddata["shift_end"],
                )
                db.add(drv)
                db.commit()
                db.refresh(drv)

            # Check or create dedicated driver login entry
            drv_login = db.query(DriverLogin).filter(DriverLogin.driver_id == drv.id).first()
            if not drv_login:
                drv_login = DriverLogin(
                    driver_id=drv.id,
                    phone=ddata["phone"],
                    password_hash=hash_password(ddata["pin"]),
                )
                db.add(drv_login)
                db.commit()

        # =====================================================================
        # 4. Orders (~15 Orders matching Frontend Mock Data)
        # =====================================================================
        now = datetime.datetime.now(datetime.timezone.utc)
        orders_data = [
            {
                "order_code": "ORD-8942",
                "tracking_uuid": "a3f8c1e2-9b44-4e21-8f3a-1c9d7b2e5f10",
                "customer_name": "Siddharth Rao",
                "customer_phone": "+91 99001 22334",
                "pickup_address": "Whitefield Logistics Depot, Block C",
                "drop_address": "HSR Layout Sector 2, #104, Bengaluru",
                "pickup_lat": 12.9863,
                "pickup_lng": 77.7308,
                "drop_lat": 12.9352,
                "drop_lng": 77.6245,
                "weight_kg": 24.0,
                "status": "delayed",
                "delay_reason": "Heavy traffic congestion along HSR Outer Ring Road junction",
                "vehicle_plate": "KA-01-GB-5091",
            },
            {
                "order_code": "ORD-8945",
                "tracking_uuid": "e7b2c9f1-3a44-4d88-8e11-5f6a7b8c9d0e",
                "customer_name": "Aarav Sharma",
                "customer_phone": "+91 98765 43210",
                "pickup_address": "Indiranagar Central Hub, 100ft Rd",
                "drop_address": "MG Road, Sector 4, #402, Bengaluru",
                "pickup_lat": 12.9719,
                "pickup_lng": 77.6412,
                "drop_lat": 12.9750,
                "drop_lng": 77.6010,
                "weight_kg": 12.5,
                "status": "in_transit",
                "vehicle_plate": "KA-01-EA-1024",
            },
            {
                "order_code": "ORD-8938",
                "tracking_uuid": "f4a1d8c2-2e33-4b77-9a00-4e5f6a7b8c9d",
                "customer_name": "Ananya Deshmukh",
                "customer_phone": "+91 98451 98765",
                "pickup_address": "Koramangala Sony World Junction",
                "drop_address": "Jayanagar 4th Block, #52, Bengaluru",
                "pickup_lat": 12.9352,
                "pickup_lng": 77.6245,
                "drop_lat": 12.9308,
                "drop_lng": 77.5838,
                "weight_kg": 8.0,
                "status": "assigned",
                "vehicle_plate": "KA-05-MC-8812",
            },
            {
                "order_code": "ORD-8935",
                "tracking_uuid": "c1d2e3f4-5a6b-7c8d-9e0f-1a2b3c4d5e6f",
                "customer_name": "Vikramaditya Iyer",
                "customer_phone": "+91 97312 34567",
                "pickup_address": "Electronic City Phase 1 Logistics",
                "drop_address": "BTM Layout 2nd Stage, #308, Bengaluru",
                "pickup_lat": 12.8452,
                "pickup_lng": 77.6602,
                "drop_lat": 12.9166,
                "drop_lng": 77.6101,
                "weight_kg": 32.0,
                "status": "in_transit",
                "vehicle_plate": "KA-01-EA-1024",
            },
            {
                "order_code": "ORD-8930",
                "tracking_uuid": "d2e3f4a5-6b7c-8d9e-0f1a-2b3c4d5e6f7a",
                "customer_name": "Rohan Varma",
                "customer_phone": "+91 98234 56789",
                "pickup_address": "Majestic Central Depot, Bengaluru",
                "drop_address": "Malleshwaram 8th Cross, #12, Bengaluru",
                "pickup_lat": 12.9781,
                "pickup_lng": 77.5695,
                "drop_lat": 12.9980,
                "drop_lng": 77.5710,
                "weight_kg": 15.0,
                "status": "delivered",
                "vehicle_plate": "KA-03-HA-3301",
            },
            {
                "order_code": "ORD-8928",
                "tracking_uuid": "b3c4d5e6-7f8a-9b0c-1d2e-3f4a5b6c7d8e",
                "customer_name": "Kavita Krishnan",
                "customer_phone": "+91 98123 45678",
                "pickup_address": "Rajajinagar 1st Block Depot",
                "drop_address": "Yeshwanthpur Industrial Area, Bengaluru",
                "pickup_lat": 12.9900,
                "pickup_lng": 77.5520,
                "drop_lat": 13.0180,
                "drop_lng": 77.5450,
                "weight_kg": 5.5,
                "status": "pending",
                "vehicle_plate": None,
            },
            {
                "order_code": "ORD-8925",
                "tracking_uuid": "f5e6d7c8-9b0a-1c2d-3e4f-5a6b7c8d9e0f",
                "customer_name": "Manish Gupta",
                "customer_phone": "+91 97456 78901",
                "pickup_address": "Ulsoor Lake Hub",
                "drop_address": "Frazer Town Mosque Road, Bengaluru",
                "pickup_lat": 12.9780,
                "pickup_lng": 77.6200,
                "drop_lat": 12.9960,
                "drop_lng": 77.6130,
                "weight_kg": 19.0,
                "status": "assigned",
                "vehicle_plate": "KA-02-JL-4411",
            },
            {
                "order_code": "ORD-8922",
                "tracking_uuid": "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
                "customer_name": "Neha Reddy",
                "customer_phone": "+91 98901 23456",
                "pickup_address": "Marathahalli Bridge Hub",
                "drop_address": "Bellandur EcoSpace, Outer Ring Rd, Bengaluru",
                "pickup_lat": 12.9550,
                "pickup_lng": 77.7010,
                "drop_lat": 12.9304,
                "drop_lng": 77.6784,
                "weight_kg": 11.0,
                "status": "delayed",
                "delay_reason": "Heavy monsoon waterlogging along Bellandur junction",
                "vehicle_plate": "KA-01-GB-5091",
            },
            {
                "order_code": "ORD-8919",
                "tracking_uuid": "12345678-abcd-ef01-2345-6789abcdef01",
                "customer_name": "Arjun Menon",
                "customer_phone": "+91 98712 34560",
                "pickup_address": "Koramangala 4th Block Hub",
                "drop_address": "HSR Layout Sector 1, #210, Bengaluru",
                "pickup_lat": 12.9352,
                "pickup_lng": 77.6245,
                "drop_lat": 12.9116,
                "drop_lng": 77.6389,
                "weight_kg": 7.2,
                "status": "in_transit",
                "vehicle_plate": "KA-01-EA-1024",
            },
            {
                "order_code": "ORD-8915",
                "tracking_uuid": "23456789-bcde-f012-3456-789abcdef012",
                "customer_name": "Meera Nair",
                "customer_phone": "+91 98654 32109",
                "pickup_address": "Sarjapur Road Wipro Gate Depot",
                "drop_address": "Haralur Main Road, #45, Bengaluru",
                "pickup_lat": 12.9100,
                "pickup_lng": 77.6800,
                "drop_lat": 12.9050,
                "drop_lng": 77.6650,
                "weight_kg": 14.0,
                "status": "pending",
                "vehicle_plate": None,
            },
            {
                "order_code": "ORD-8912",
                "tracking_uuid": "3456789a-cdef-0123-4567-89abcdef0123",
                "customer_name": "Karthik Swamy",
                "customer_phone": "+91 99123 45678",
                "pickup_address": "Bannerghatta National Park Road Hub",
                "drop_address": "JP Nagar 6th Phase, #88, Bengaluru",
                "pickup_lat": 12.8800,
                "pickup_lng": 77.5900,
                "drop_lat": 12.9080,
                "drop_lng": 77.5850,
                "weight_kg": 22.0,
                "status": "delivered",
                "vehicle_plate": "KA-03-HA-3301",
            },
            {
                "order_code": "ORD-8908",
                "tracking_uuid": "456789ab-def0-1234-5678-9abcdef01234",
                "customer_name": "Pooja Hegde",
                "customer_phone": "+91 97890 12345",
                "pickup_address": "Whitefield ITPL Main Road Depot",
                "drop_address": "Hoodi Circle, #10, Bengaluru",
                "pickup_lat": 12.9863,
                "pickup_lng": 77.7308,
                "drop_lat": 12.9920,
                "drop_lng": 77.7150,
                "weight_kg": 6.0,
                "status": "delivered",
                "vehicle_plate": "KA-05-PQ-3390",
            },
            {
                "order_code": "ORD-8905",
                "tracking_uuid": "56789abc-ef01-2345-6789-abcdef012345",
                "customer_name": "Aditya Joshi",
                "customer_phone": "+91 99765 43210",
                "pickup_address": "Hebbal Flyover Logistics Center",
                "drop_address": "Yelahanka New Town, #140, Bengaluru",
                "pickup_lat": 13.0350,
                "pickup_lng": 77.5970,
                "drop_lat": 13.0600,
                "drop_lng": 77.5950,
                "weight_kg": 16.5,
                "status": "pending",
                "vehicle_plate": None,
            },
            {
                "order_code": "ORD-8901",
                "tracking_uuid": "6789abcd-f012-3456-789a-bcdef0123456",
                "customer_name": "Ritu Sen",
                "customer_phone": "+91 98456 12378",
                "pickup_address": "Indiranagar 100ft Road Hub",
                "drop_address": "Domlur 2nd Stage, #19, Bengaluru",
                "pickup_lat": 12.9719,
                "pickup_lng": 77.6412,
                "drop_lat": 12.9600,
                "drop_lng": 77.6400,
                "weight_kg": 9.0,
                "status": "in_transit",
                "vehicle_plate": "KA-02-BN-8833",
            },
            {
                "order_code": "ORD-8898",
                "tracking_uuid": "789abcde-0123-4567-89ab-cdef01234567",
                "customer_name": "Sandeep Patil",
                "customer_phone": "+91 97654 32189",
                "pickup_address": "Basavanagudi Bull Temple Road Depot",
                "drop_address": "Gandhi Bazaar Main Road, Bengaluru",
                "pickup_lat": 12.9420,
                "pickup_lng": 77.5680,
                "drop_lat": 12.9420,
                "drop_lng": 77.5740,
                "weight_kg": 13.5,
                "status": "delivered",
                "vehicle_plate": "KA-03-TR-6614",
            },
        ]

        order_map = {}
        for odata in orders_data:
            ord_obj = db.query(Order).filter(Order.order_code == odata["order_code"]).first()
            assigned_veh = vehicle_map.get(odata["vehicle_plate"]) if odata["vehicle_plate"] else None
            if not ord_obj:
                ord_obj = Order(
                    order_code=odata["order_code"],
                    tracking_uuid=odata["tracking_uuid"],
                    customer_name=odata["customer_name"],
                    customer_phone=odata["customer_phone"],
                    pickup_address=odata["pickup_address"],
                    drop_address=odata["drop_address"],
                    pickup_lat=odata["pickup_lat"],
                    pickup_lng=odata["pickup_lng"],
                    drop_lat=odata["drop_lat"],
                    drop_lng=odata["drop_lng"],
                    weight_kg=odata["weight_kg"],
                    time_window_start=now - datetime.timedelta(hours=2),
                    time_window_end=now + datetime.timedelta(hours=2),
                    status=odata["status"],
                    delay_reason=odata.get("delay_reason"),
                    vehicle_id=assigned_veh.id if assigned_veh else None,
                )
                db.add(ord_obj)
                db.commit()
                db.refresh(ord_obj)
            order_map[odata["order_code"]] = ord_obj

        # =====================================================================
        # 5. Maintenance Tickets
        # =====================================================================
        tickets_data = [
            {
                "plate_no": "KA-04-MH-9920",
                "trigger_type": "mileage",
                "description": "Scheduled 40,000 km brake pad and transmission fluid service",
                "status": "open",
            },
            {
                "plate_no": "KA-01-GB-5091",
                "trigger_type": "manual",
                "description": "Engine warning check light illuminated during HSR delivery shift",
                "status": "in_progress",
            },
            {
                "plate_no": "KA-03-HA-3301",
                "trigger_type": "mileage",
                "description": "30,000 km routine multi-point safety inspection and wheel alignment",
                "status": "resolved",
            },
        ]

        for tdata in tickets_data:
            veh = vehicle_map.get(tdata["plate_no"])
            if veh:
                existing_t = (
                    db.query(MaintenanceTicket)
                    .filter(
                        MaintenanceTicket.vehicle_id == veh.id,
                        MaintenanceTicket.description == tdata["description"],
                    )
                    .first()
                )
                if not existing_t:
                    t = MaintenanceTicket(
                        vehicle_id=veh.id,
                        trigger_type=tdata["trigger_type"],
                        description=tdata["description"],
                        status=tdata["status"],
                    )
                    db.add(t)
                    db.commit()

        # =====================================================================
        # 6. Notifications (with is_ai_generated=True/False)
        # =====================================================================
        notifications_data = [
            {
                "order_code": "ORD-8942",
                "is_ai_generated": True,
                "channel": "sms",
                "message": (
                    "Hello Siddharth, your delivery ORD-8942 is experiencing a temporary ~25 min delay "
                    "due to peak traffic congestion along the HSR Outer Ring Road junction. Driver Priya Nair "
                    "is en route and navigating the shortest alternate bypass path to reach you safely."
                ),
            },
            {
                "order_code": "ORD-8922",
                "is_ai_generated": True,
                "channel": "sms",
                "message": (
                    "Dear Neha, your order ORD-8922 is currently delayed by ~30 mins due to severe "
                    "monsoon waterlogging along Bellandur junction. Driver has rerouted to ensure safe delivery."
                ),
            },
            {
                "order_code": "ORD-8945",
                "is_ai_generated": False,
                "channel": "sms",
                "message": (
                    "Your RouteWise order ORD-8945 has been picked up by Rahul Sharma (KA-01-EA-1024). "
                    "Driver is en route with estimated on-time arrival at 2:20 PM."
                ),
            },
            {
                "order_code": "ORD-8935",
                "is_ai_generated": False,
                "channel": "email",
                "message": (
                    "Order ORD-8935 has departed the BTM depot and is on schedule for delivery "
                    "between 1:00 PM and 3:00 PM."
                ),
            },
        ]

        for ndata in notifications_data:
            ord_obj = order_map.get(ndata["order_code"])
            if ord_obj:
                existing_n = (
                    db.query(Notification)
                    .filter(
                        Notification.order_id == ord_obj.id,
                        Notification.message == ndata["message"],
                    )
                    .first()
                )
                if not existing_n:
                    notif = Notification(
                        order_id=ord_obj.id,
                        message=ndata["message"],
                        channel=ndata["channel"],
                        is_ai_generated=ndata["is_ai_generated"],
                    )
                    db.add(notif)
                    db.commit()

        # =====================================================================
        # 7. Collect and return table counts
        # =====================================================================
        counts = {
            "managers": db.query(func.count(Manager.id)).scalar(),
            "vehicles": db.query(func.count(Vehicle.id)).scalar(),
            "drivers": db.query(func.count(Driver.id)).scalar(),
            "driver_logins": db.query(func.count(DriverLogin.id)).scalar(),
            "orders": db.query(func.count(Order.id)).scalar(),
            "routes": db.query(func.count(Route.id)).scalar(),
            "route_stops": db.query(func.count(RouteStop.id)).scalar(),
            "maintenance_tickets": db.query(func.count(MaintenanceTicket.id)).scalar(),
            "notifications": db.query(func.count(Notification.id)).scalar(),
        }
        return counts

    finally:
        db.close()


def print_summary(counts: Dict[str, int]) -> None:
    """Print formatted summary of seeded records and demo credentials."""
    print("\n" + "=" * 80)
    print(" ROUTEWISE DATABASE SEEDING COMPLETED ".center(80, "="))
    print("=" * 80)
    print(f" {'TABLE NAME':<30} | {'ROW COUNT':<10}")
    print("-" * 80)
    for table_name, count in counts.items():
        print(f" {table_name:<30} | {count:<10}")
    print("=" * 80)

    print("\n" + "=" * 80)
    print(" DEMO CREDENTIALS (BCRYPT PROTECTED) ".center(80, "="))
    print("=" * 80)
    print(" [MANAGER LOGIN] (Dedicated Managers Table):")
    print("   Email    : manager@routewise.com")
    print("   Password : manager123")
    print()
    print(" [DRIVER LOGINS] (Dedicated DriverLogins Table):")
    print("   Driver 1 : +91 98450 11223 (Rahul Sharma)  | PIN : 1024")
    print("   Driver 2 : +91 99011 44556 (Priya Nair)    | PIN : 5091")
    print("   Driver 3 : +91 97400 88990 (Amit Patel)    | PIN : 8812")
    print("   Driver 4 : +91 98800 22331 (Vikram Singh)  | PIN : 3301")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    table_counts = seed_database()
    print_summary(table_counts)
