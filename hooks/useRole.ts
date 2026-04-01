"use client"
import { useState, useEffect } from "react";

export function useRole() {
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem("user");
    if (raw) {
      const user = JSON.parse(raw);
      setRole(user.role);
      setUserId(user.id);
    }
  }, []);

  const isAdmin = role === "admin";

  return { role, userId, isAdmin };
}