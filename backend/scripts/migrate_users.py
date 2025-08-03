#!/usr/bin/env python3
"""
Script de migración para asignar contraseñas a usuarios existentes
Este script debe ejecutarse una sola vez después de implementar el sistema de autenticación

Uso:
    python scripts/migrate_users.py

Opciones:
    --default-password: Contraseña por defecto para usuarios sin password (default: 'changeme123')
    --reset-all: Resetear contraseñas de todos los usuarios, incluso los que ya tienen
"""

import sys
import os
import argparse
from datetime import datetime

# Agregar el directorio padre al path para importar módulos del backend
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy.orm import Session
from db import SessionLocal
from models.usuarios import Usuario
from security.utils import hash_password

def migrate_users(default_password: str = "changeme123", reset_all: bool = False):
    """
    Migra usuarios existentes sin password_hash asignándoles una contraseña por defecto
    
    Args:
        default_password: Contraseña por defecto para usuarios sin password
        reset_all: Si True, resetea la contraseña de todos los usuarios
    """
    db: Session = SessionLocal()
    
    try:
        # Buscar usuarios sin password_hash o todos si reset_all=True
        if reset_all:
            users = db.query(Usuario).all()
            print(f"🔄 Reseteando contraseñas para {len(users)} usuarios...")
        else:
            users = db.query(Usuario).filter(Usuario.password_hash.is_(None)).all()
            print(f"🔍 Encontrados {len(users)} usuarios sin contraseña...")
        
        if not users:
            print("✅ No hay usuarios que migrar.")
            return
        
        migrated_count = 0
        hashed_password = hash_password(default_password)
        
        for user in users:
            # Asignar contraseña hasheada
            user.password_hash = hashed_password
            
            # Actualizar fecha_registro si no existe
            if not user.fecha_registro:
                user.fecha_registro = datetime.utcnow()
            
            # Asegurar que el usuario está activo
            if user.activo is None:
                user.activo = True
            
            migrated_count += 1
            print(f"  📧 {user.email} -> contraseña actualizada")
        
        # Guardar cambios
        db.commit()
        
        print(f"✅ Migración completada exitosamente!")
        print(f"📊 {migrated_count} usuarios actualizados")
        print(f"🔑 Contraseña por defecto: '{default_password}'")
        print()
        print("⚠️  IMPORTANTE:")
        print("   - Los usuarios deben cambiar su contraseña en el primer login")
        print("   - Considera implementar un sistema de reset de contraseñas")
        print("   - Informa a los usuarios sobre sus nuevas credenciales")
        
    except Exception as e:
        print(f"❌ Error durante la migración: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def list_users():
    """
    Lista todos los usuarios y su estado de migración
    """
    db: Session = SessionLocal()
    
    try:
        users = db.query(Usuario).all()
        
        print(f"📋 Lista de usuarios ({len(users)} total):")
        print("-" * 80)
        print(f"{'ID':<5} {'Email':<30} {'Nombre':<20} {'Password':<10} {'Activo':<7}")
        print("-" * 80)
        
        for user in users:
            has_password = "✅" if user.password_hash else "❌"
            is_active = "✅" if user.activo else "❌"
            
            print(f"{user.id_usuario:<5} {user.email:<30} {user.nombre:<20} {has_password:<10} {is_active:<7}")
        
        print("-" * 80)
        
        # Estadísticas
        with_password = sum(1 for u in users if u.password_hash)
        without_password = len(users) - with_password
        active_users = sum(1 for u in users if u.activo)
        
        print(f"📊 Estadísticas:")
        print(f"   Con contraseña: {with_password}")
        print(f"   Sin contraseña: {without_password}")
        print(f"   Usuarios activos: {active_users}")
        
    except Exception as e:
        print(f"❌ Error listando usuarios: {e}")
    finally:
        db.close()

def main():
    parser = argparse.ArgumentParser(
        description="Script de migración para sistema de autenticación"
    )
    parser.add_argument(
        "--default-password",
        default="changeme123",
        help="Contraseña por defecto para usuarios sin password (default: changeme123)"
    )
    parser.add_argument(
        "--reset-all",
        action="store_true",
        help="Resetear contraseñas de todos los usuarios"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="Listar usuarios y su estado"
    )
    
    args = parser.parse_args()
    
    print("🔐 Script de Migración - Sistema de Autenticación")
    print("=" * 50)
    
    if args.list:
        list_users()
    else:
        # Confirmación antes de ejecutar
        if args.reset_all:
            confirm = input("⚠️  ¿Estás seguro de resetear TODAS las contraseñas? (yes/no): ")
        else:
            confirm = input("¿Proceder con la migración de usuarios sin contraseña? (yes/no): ")
        
        if confirm.lower() == 'yes':
            migrate_users(args.default_password, args.reset_all)
        else:
            print("❌ Migración cancelada")

if __name__ == "__main__":
    main()