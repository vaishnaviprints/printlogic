import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle, XCircle, Eye, RefreshCw } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ComplaintsPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [resolveForm, setResolveForm] = useState({
    status: 'under_review',
    admin_notes: '',
    resolution: '',
    resolution_action: ''
  });

  useEffect(() => {
    fetchComplaints();
  }, [filterStatus]);

  const fetchComplaints = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const url = filterStatus === 'all' 
        ? `${API}/admin/complaints`
        : `${API}/admin/complaints?status=${filterStatus}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setComplaints(response.data);
    } catch (error) {
      console.error('Failed to fetch complaints:', error);
      toast.error('Failed to load complaints');
    } finally {
      setLoading(false);
    }
  };

  const handleViewComplaint = (complaint) => {
    setSelectedComplaint(complaint);
    setResolveForm({
      status: complaint.status,
      admin_notes: complaint.admin_notes || '',
      resolution: complaint.resolution || '',
      resolution_action: complaint.resolution_action || ''
    });
    setViewDialogOpen(true);
  };

  const handleUpdateComplaint = async () => {
    if (!selectedComplaint) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/complaints/${selectedComplaint.id}`,
        resolveForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Complaint updated successfully');
      setViewDialogOpen(false);
      fetchComplaints();
    } catch (error) {
      console.error('Failed to update complaint:', error);
      toast.error('Failed to update complaint');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>,
      under_review: <Badge variant="outline" className="bg-blue-100 text-blue-800">Under Review</Badge>,
      approved: <Badge variant="outline" className="bg-green-100 text-green-800">Approved</Badge>,
      rejected: <Badge variant="outline" className="bg-red-100 text-red-800">Rejected</Badge>,
      resolved: <Badge variant="outline" className="bg-gray-100 text-gray-800">Resolved</Badge>
    };
    return badges[status] || badges.pending;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Customer Complaints</h2>
          <p className="text-gray-600">Manage customer complaints and quality issues</p>
        </div>
        <Button onClick={fetchComplaints} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label>Filter by Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Complaints</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaints List */}
      {loading ? (
        <div className="text-center py-8">Loading complaints...</div>
      ) : complaints.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No complaints found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusBadge(complaint.status)}
                      <span className="text-sm text-gray-500">
                        Order: {complaint.order_id}
                      </span>
                    </div>
                    <h3 className="font-semibold text-lg mb-1">{complaint.customer_name}</h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {complaint.customer_email} • {complaint.customer_phone}
                    </p>
                    <p className="text-gray-700 mb-2">{complaint.complaint_text}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>Type: {complaint.complaint_type}</span>
                      <span>•</span>
                      <span>{new Date(complaint.created_at).toLocaleString()}</span>
                    </div>
                    {complaint.vendor_name && (
                      <p className="text-sm text-gray-600 mt-1">
                        Vendor: {complaint.vendor_name}
                      </p>
                    )}
                  </div>
                  <Button onClick={() => handleViewComplaint(complaint)} size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View & Resolve
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View/Resolve Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Complaint Details & Resolution</DialogTitle>
          </DialogHeader>
          {selectedComplaint && (
            <div className="space-y-4">
              {/* Complaint Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Complaint Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><strong>Order ID:</strong> {selectedComplaint.order_id}</div>
                  <div><strong>Customer:</strong> {selectedComplaint.customer_name}</div>
                  <div><strong>Email:</strong> {selectedComplaint.customer_email}</div>
                  <div><strong>Phone:</strong> {selectedComplaint.customer_phone}</div>
                  <div><strong>Type:</strong> {selectedComplaint.complaint_type}</div>
                  <div><strong>Date:</strong> {new Date(selectedComplaint.created_at).toLocaleString()}</div>
                  <div className="pt-2">
                    <strong>Complaint:</strong>
                    <p className="mt-1 p-2 bg-gray-50 rounded">{selectedComplaint.complaint_text}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Proof Images */}
              {selectedComplaint.proof_images && selectedComplaint.proof_images.length > 0 && (
                <div>
                  <Label>Proof Images:</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {selectedComplaint.proof_images.map((img, idx) => (
                      <img key={idx} src={img} alt="Proof" className="rounded border" />
                    ))}
                  </div>
                </div>
              )}

              {/* Resolution Form */}
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label>Status</Label>
                  <Select value={resolveForm.status} onValueChange={(v) => setResolveForm({...resolveForm, status: v})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="approved">Approved (Reprint)</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Resolution Action</Label>
                  <Select value={resolveForm.resolution_action} onValueChange={(v) => setResolveForm({...resolveForm, resolution_action: v})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reprint">Reprint Approved</SelectItem>
                      <SelectItem value="refund">Refund Issued</SelectItem>
                      <SelectItem value="reject">Complaint Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Admin Notes (Internal)</Label>
                  <Textarea
                    value={resolveForm.admin_notes}
                    onChange={(e) => setResolveForm({...resolveForm, admin_notes: e.target.value})}
                    placeholder="Internal notes about investigation..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label>Resolution (Customer-facing)</Label>
                  <Textarea
                    value={resolveForm.resolution}
                    onChange={(e) => setResolveForm({...resolveForm, resolution: e.target.value})}
                    placeholder="Resolution message for customer..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateComplaint} className="bg-indigo-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              Update Complaint
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ComplaintsPage;
