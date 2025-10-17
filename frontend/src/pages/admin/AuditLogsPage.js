import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { RefreshCw, FileText, User, Calendar } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AuditLogsPage = () => {
  const [pricingAudits, setPricingAudits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterUser, setFilterUser] = useState('');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    fetchPricingAudits();
  }, []);

  const fetchPricingAudits = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/pricing-audits`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPricingAudits(response.data);
    } catch (error) {
      console.error('Failed to fetch pricing audits:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort audits
  const filteredAudits = pricingAudits
    .filter(audit => {
      if (filterUser && !audit.changed_by?.toLowerCase().includes(filterUser.toLowerCase())) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.changed_at) - new Date(a.changed_at);
      } else if (sortBy === 'date_asc') {
        return new Date(a.changed_at) - new Date(b.changed_at);
      }
      return 0;
    });

  return (
    <div data-testid="audit-logs-page">
      <Tabs defaultValue="pricing" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pricing">Pricing Audits</TabsTrigger>
            <TabsTrigger value="vendor">Vendor Audits</TabsTrigger>
          </TabsList>
          <Button onClick={fetchPricingAudits} disabled={loading} variant="outline">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Pricing Audits Tab */}
        <TabsContent value="pricing" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label>Filter by User</Label>
                  <Input
                    placeholder="Search by email..."
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Sort By</Label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-gray-300"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="date_desc">Newest First</option>
                    <option value="date_asc">Oldest First</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Logs */}
          <div className="space-y-4">
            {filteredAudits.map((audit) => (
              <Card key={audit.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-indigo-600 mt-0.5" />
                      <div>
                        <CardTitle className="text-base">Pricing Rule Change</CardTitle>
                        <CardDescription className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {audit.changed_by}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(audit.changed_at).toLocaleString()}
                          </span>
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">Rule ID: {audit.rule_id}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {audit.reason && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-900">Reason</div>
                      <div className="text-sm text-blue-700">{audit.reason}</div>
                    </div>
                  )}
                  
                  {audit.diff && (
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Changes</div>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Old Value</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">New Value</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {audit.diff.paperType && (
                              <tr>
                                <td className="px-4 py-2 text-sm font-medium" colSpan={3}>
                                  Paper Type: {audit.diff.paperType}
                                </td>
                              </tr>
                            )}
                            {audit.diff.changes && Object.entries(audit.diff.changes).map(([key, change]) => (
                              <tr key={key}>
                                <td className="px-4 py-2 text-sm">{key}</td>
                                <td className="px-4 py-2 text-sm">
                                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                                    {typeof change.old === 'number' ? `₹${change.old}` : change.old}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-sm">
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                                    {typeof change.new === 'number' ? `₹${change.new}` : change.new}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {filteredAudits.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-gray-500">
                  No audit logs found
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Vendor Audits Tab */}
        <TabsContent value="vendor" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Vendor Audit Logs</CardTitle>
              <CardDescription>Track changes made to vendor accounts and settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p>Vendor audit logs will be displayed here</p>
                <p className="text-sm mt-2">Tracks changes to vendor profiles, status, badges, and certifications</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AuditLogsPage;
