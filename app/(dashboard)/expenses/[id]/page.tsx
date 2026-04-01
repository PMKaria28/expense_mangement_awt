"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function getToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth-token") || "";
}

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  };
}

export default function ExpenseDetailPage() {
  const params = useParams();
  const id = params.id;
  const [expense, setExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpense();
  }, [id]);

  async function fetchExpense() {
    try {
      setLoading(true);
      const res = await fetch(`/api/expenses/${id}`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch expense");
      const data = await res.json();
      setExpense(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;
  if (!expense) return <div className="p-4">Expense not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Expense Details</h1>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="font-semibold">Amount:</label>
            <p className="text-lg">${expense.Amount}</p>
          </div>
          <div>
            <label className="font-semibold">Date:</label>
            <p>{new Date(expense.ExpenseDate).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="font-semibold">Details:</label>
            <p>{expense.ExpenseDetail}</p>
          </div>
          <div>
            <label className="font-semibold">Description:</label>
            <p>{expense.Description}</p>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </Card>
    </div>
  );
}
