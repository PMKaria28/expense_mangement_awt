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

export default function IncomeDetailPage() {
  const params = useParams();
  const id = params.id;
  const [income, setIncome] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncome();
  }, [id]);

  async function fetchIncome() {
    try {
      setLoading(true);
      const res = await fetch(`/api/incomes/${id}`, { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch income");
      const data = await res.json();
      setIncome(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;
  if (!income) return <div className="p-4">Income not found</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Income Details</h1>
      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <label className="font-semibold">Amount:</label>
            <p className="text-lg">${income.Amount}</p>
          </div>
          <div>
            <label className="font-semibold">Date:</label>
            <p>{new Date(income.IncomeDate).toLocaleDateString()}</p>
          </div>
          <div>
            <label className="font-semibold">Details:</label>
            <p>{income.IncomeDetail}</p>
          </div>
          <div>
            <label className="font-semibold">Description:</label>
            <p>{income.Description}</p>
          </div>
        </div>
        <div className="mt-6">
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </Card>
    </div>
  );
}
