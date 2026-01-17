import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, MousePointer, Share2, Download, TrendingUp, Users, Globe } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  totalClicks: number;
  totalShares: number;
  totalDownloads: number;
  viewsByDay: Array<{
    date: string;
    views: number;
    uniqueVisitors: number;
  }>;
  topReferrers: Array<{
    referrer: string;
    count: number;
  }>;
  clicksByTarget: Array<{
    target: string;
    count: number;
  }>;
}

interface AnalyticsDashboardProps {
  openalexId: string;
}

export default function AnalyticsDashboard({ openalexId }: AnalyticsDashboardProps) {
  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: [`/api/analytics/${openalexId}`],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  // Default data if no analytics yet
  const data = analytics || {
    totalViews: 0,
    uniqueVisitors: 0,
    totalClicks: 0,
    totalShares: 0,
    totalDownloads: 0,
    viewsByDay: [],
    topReferrers: [],
    clicksByTarget: [],
  };

  const StatCard = ({ 
    icon: Icon, 
    label, 
    value, 
    trend,
    color = "text-primary"
  }: { 
    icon: any; 
    label: string; 
    value: number; 
    trend?: number;
    color?: string;
  }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center ${color}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            <span>{Math.abs(trend)}% vs last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard 
          icon={Eye} 
          label="Total Views" 
          value={data.totalViews} 
          color="text-blue-600"
        />
        <StatCard 
          icon={Users} 
          label="Unique Visitors" 
          value={data.uniqueVisitors}
          color="text-purple-600"
        />
        <StatCard 
          icon={MousePointer} 
          label="Clicks" 
          value={data.totalClicks}
          color="text-green-600"
        />
        <StatCard 
          icon={Share2} 
          label="Shares" 
          value={data.totalShares}
          color="text-amber-600"
        />
        <StatCard 
          icon={Download} 
          label="Downloads" 
          value={data.totalDownloads}
          color="text-rose-600"
        />
      </div>

      {/* Views Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Profile Views</CardTitle>
          <CardDescription>Views and visitors over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          {data.viewsByDay.length > 0 ? (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.viewsByDay}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                    labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="views" 
                    stroke="#3b82f6" 
                    fillOpacity={1} 
                    fill="url(#colorViews)"
                    name="Views"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="uniqueVisitors" 
                    stroke="#8b5cf6" 
                    fillOpacity={1} 
                    fill="url(#colorVisitors)"
                    name="Unique Visitors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-72 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Eye className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>No analytics data yet</p>
                <p className="text-sm">Views will appear here once your profile gets traffic</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Stats */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Referrers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Referrers</CardTitle>
            <CardDescription>Where your visitors come from</CardDescription>
          </CardHeader>
          <CardContent>
            {data.topReferrers.length > 0 ? (
              <div className="space-y-3">
                {data.topReferrers.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm truncate max-w-[200px]">
                        {item.referrer || 'Direct'}
                      </span>
                    </div>
                    <span className="text-sm font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No referrer data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Click Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Click Distribution</CardTitle>
            <CardDescription>What visitors click on most</CardDescription>
          </CardHeader>
          <CardContent>
            {data.clicksByTarget.length > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.clicksByTarget.slice(0, 5)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis 
                      dataKey="target" 
                      type="category" 
                      tick={{ fontSize: 12 }} 
                      width={100}
                    />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No click data yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
