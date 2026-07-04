from sqlalchemy.orm import Session
import sqlalchemy
from src.models.models import User, Role
from src.repositories.base import BaseRepository

class UserRepository(BaseRepository):
    def get_by_id(self, user_id: int) -> User:
        return self.db.query(User).filter(User.id == user_id).first()

    def get_by_username(self, username: str) -> User:
        return self.db.query(User).filter(User.username == username).first()

    def get_by_email(self, email: str) -> User:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_employee_id(self, employee_id: str) -> User:
        return self.db.query(User).filter(User.employee_id == employee_id).first()

    def get_by_name(self, name: str) -> User:
        return self.db.query(User).filter(sqlalchemy.func.lower(User.name) == sqlalchemy.func.lower(name)).first()

    def get_all(self) -> list[User]:
        return self.db.query(User).all()

    def get_role_by_name(self, role_name: str) -> Role:
        return self.db.query(Role).filter(Role.name == role_name).first()

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

    def delete(self, user: User) -> None:
        self.db.delete(user)
