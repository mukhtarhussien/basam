"use client";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
export default function ThemeToggle(){
  const [dark,setDark]=useState(false);
  useEffect(()=>{const saved=localStorage.getItem("basam-theme");const enabled=saved==="dark"||(!saved&&matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",enabled);setDark(enabled)},[]);
  const toggle=()=>{const n=!dark;document.documentElement.classList.toggle("dark",n);localStorage.setItem("basam-theme",n?"dark":"light");setDark(n)};
  return <button onClick={toggle} aria-label="تبديل المظهر" className="grid h-11 w-11 place-items-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] transition hover:-translate-y-0.5">{dark?<Sun size={18}/>:<Moon size={18}/>}</button>;
}
