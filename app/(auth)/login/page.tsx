"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-sm border border-border rounded-lg p-6 space-y-4">
        <h1 className="text-lg font-semibold">Sign in</h1>
        <Input type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && signIn("credentials", { email })} />
        <Button className="w-full" onClick={() => signIn("credentials", { email })}>Continue</Button>
        <p className="text-xs text-muted-foreground">Demo mode: any email works.</p>
      </div>
    </div>
  );
}
