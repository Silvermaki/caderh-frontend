"use client"
import React, { useState, useEffect } from 'react';
import { Breadcrumbs, BreadcrumbItem } from "@/components/ui/breadcrumbs";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Brush, AreaChart, Area, Legend, Bar, ComposedChart } from "recharts";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { prettifyNumber } from '@/app/libs/utils';
import { Button } from "@/components/ui/button";
import { BarChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const Page = () => {

  return (
    <div>
      <Breadcrumbs>
        <BreadcrumbItem>Plataforma</BreadcrumbItem>
        <BreadcrumbItem className="text-primary">Estadísticas</BreadcrumbItem>
      </Breadcrumbs>
    </div>
  );
};

export default Page;