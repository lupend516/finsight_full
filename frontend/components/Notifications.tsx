import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  Bell,
  AlertCircle,
  CheckCircle2,
  Info,
  DollarSign,
  Shield,
  FileText,
  CreditCard,
  Trash2,
  Check,
  X
} from 'lucide-react';

export function Notifications() {
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      type: 'risk',
      title: 'Unusual expense detected in March',
      description: 'A transaction of ₸125,000 KZT was flagged as unusual. Review recommended.',
      time: '2 hours ago',
      read: false,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      id: '2',
      type: 'ai',
      title: 'Cash flow risk predicted within the next 30 days',
      description: 'Based on current trends, cash reserves may drop below optimal levels. Consider adjusting payment terms.',
      time: '5 hours ago',
      read: false,
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      id: '3',
      type: 'report',
      title: 'New financial report is ready to download',
      description: 'Your January 2026 Profit & Loss Statement is ready for download.',
      time: '1 day ago',
      read: true,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: '4',
      type: 'billing',
      title: 'Your subscription will renew in 3 days',
      description: 'Premium Plan (90,000 KZT) will be charged on February 15, 2026.',
      time: '1 day ago',
      read: true,
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: '5',
      type: 'audit',
      title: 'Missing receipts detected',
      description: '3 transactions from last week are missing receipt attachments.',
      time: '2 days ago',
      read: false,
      icon: Shield,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      id: '6',
      type: 'ai',
      title: 'Revenue growth opportunity identified',
      description: 'AI detected that your consulting services have 45% higher margins than product sales.',
      time: '2 days ago',
      read: true,
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: '7',
      type: 'risk',
      title: 'Duplicate payment flagged',
      description: 'Possible duplicate invoice payment to vendor "Office Supplies Ltd".',
      time: '3 days ago',
      read: true,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      id: '8',
      type: 'report',
      title: '13-Week Cash Flow Forecast updated',
      description: 'Your cash flow forecast has been updated with the latest data.',
      time: '4 days ago',
      read: true,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ]);

  const [activeTab, setActiveTab] = useState('all');

  const markAsRead = (id: string) => {
    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filterNotifications = (type: string) => {
    if (type === 'all') return notifications;
    return notifications.filter(n => n.type === type);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = filterNotifications(activeTab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            Notifications
            {unreadCount > 0 && (
              <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                {unreadCount} new
              </Badge>
            )}
          </h3>
          <p className="text-slate-600 mt-1">Stay updated on your financial activities</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllAsRead}>
            <Check size={16} className="mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      {/* Filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            All
            {notifications.length > 0 && (
              <Badge variant="secondary" className="ml-2">{notifications.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="ai">AI Insights</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
          <TabsTrigger value="risk">Risk Alerts</TabsTrigger>
          <TabsTrigger value="report">Reports</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 mb-2">No notifications</h3>
              <p className="text-slate-600">You're all caught up! Check back later for updates.</p>
            </Card>
          ) : (
            filteredNotifications.map((notification) => {
              const Icon = notification.icon;
              return (
                <Card
                  key={notification.id}
                  className={`p-5 transition-all hover:shadow-md ${
                    !notification.read ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`w-12 h-12 ${notification.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <Icon size={24} className={notification.color} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-slate-900">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-blue-600 rounded-full" />
                            )}
                          </div>
                          <p className="text-sm text-slate-600">
                            {notification.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-slate-500">{notification.time}</span>
                        <div className="flex items-center gap-2">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle2 size={14} className="mr-1" />
                              Mark as read
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 size={14} className="text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Notification Settings Card */}
      <Card className="p-6 bg-gradient-to-r from-slate-50 to-blue-50 border-blue-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Info size={24} className="text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-slate-900 mb-2">Manage Notification Preferences</h3>
            <p className="text-sm text-slate-700 mb-4">
              Control which notifications you receive and how you're alerted. Customize your notification settings to stay informed without being overwhelmed.
            </p>
            <Button variant="outline" className="bg-white">
              Go to Settings
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
