import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, RefreshCw, Shield } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AssistantAdminPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  
  const [createForm, setCreateForm] = useState({
    email: '',
    password: '',
    name: '',
    role: 'assistant_admin',
    permissions: {
      can_view_orders: true,
      can_edit_orders: false,
      can_view_vendors: true,
      can_edit_vendors: false,
      can_add_vendors: false,
      can_delete_vendors: false,
      can_view_pricing: true,
      can_edit_pricing: false,
      can_view_reports: true,
      can_view_complaints: true,
      can_resolve_complaints: false,
      can_view_settings: false,
      can_edit_settings: false,
      can_manage_admins: false
    }
  });

  const [editForm, setEditForm] = useState({
    name: '',
    permissions: {},
    is_active: true
  });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/admin/assistant-admins`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdmins(response.data);
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      toast.error('Failed to load assistant admins');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      await axios.post(`${API}/admin/assistant-admins`, createForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Assistant admin created successfully');
      setCreateDialogOpen(false);
      setCreateForm({
        email: '',
        password: '',
        name: '',
        role: 'assistant_admin',
        permissions: {
          can_view_orders: true,
          can_edit_orders: false,
          can_view_vendors: true,
          can_edit_vendors: false,
          can_add_vendors: false,
          can_delete_vendors: false,
          can_view_pricing: true,
          can_edit_pricing: false,
          can_view_reports: true,
          can_view_complaints: true,
          can_resolve_complaints: false,
          can_view_settings: false,
          can_edit_settings: false,
          can_manage_admins: false
        }
      });
      fetchAdmins();
    } catch (error) {
      console.error('Failed to create admin:', error);
      toast.error(error.response?.data?.detail || 'Failed to create assistant admin');
    }
  };

  const handleEditAdmin = (admin) => {
    setSelectedAdmin(admin);
    setEditForm({
      name: admin.name,
      permissions: admin.permissions,
      is_active: admin.is_active
    });
    setEditDialogOpen(true);
  };

  const handleUpdateAdmin = async () => {
    if (!selectedAdmin) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.put(
        `${API}/admin/assistant-admins/${selectedAdmin.id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Assistant admin updated successfully');
      setEditDialogOpen(false);
      fetchAdmins();
    } catch (error) {
      console.error('Failed to update admin:', error);
      toast.error('Failed to update assistant admin');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!confirm('Are you sure you want to delete this assistant admin?')) return;

    try {
      const token = localStorage.getItem('admin_token');
      await axios.delete(`${API}/admin/assistant-admins/${adminId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Assistant admin deleted successfully');
      fetchAdmins();
    } catch (error) {
      console.error('Failed to delete admin:', error);
      toast.error('Failed to delete assistant admin');
    }
  };

  const updatePermission = (form, setForm, key, value) => {
    setForm({
      ...form,
      permissions: {
        ...form.permissions,
        [key]: value
      }
    });
  };

  const PermissionToggles = ({ permissions, setPermissions, form, setForm }) => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center justify-between">
          <Label>View Orders</Label>
          <Switch
            checked={permissions.can_view_orders}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_view_orders', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Edit Orders</Label>
          <Switch
            checked={permissions.can_edit_orders}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_edit_orders', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>View Vendors</Label>
          <Switch
            checked={permissions.can_view_vendors}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_view_vendors', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Edit Vendors</Label>
          <Switch
            checked={permissions.can_edit_vendors}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_edit_vendors', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Add Vendors</Label>
          <Switch
            checked={permissions.can_add_vendors}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_add_vendors', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Delete Vendors</Label>
          <Switch
            checked={permissions.can_delete_vendors}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_delete_vendors', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>View Pricing</Label>
          <Switch
            checked={permissions.can_view_pricing}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_view_pricing', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Edit Pricing</Label>
          <Switch
            checked={permissions.can_edit_pricing}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_edit_pricing', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>View Reports</Label>
          <Switch
            checked={permissions.can_view_reports}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_view_reports', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>View Complaints</Label>
          <Switch
            checked={permissions.can_view_complaints}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_view_complaints', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Resolve Complaints</Label>
          <Switch
            checked={permissions.can_resolve_complaints}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_resolve_complaints', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>View Settings</Label>
          <Switch
            checked={permissions.can_view_settings}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_view_settings', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Edit Settings</Label>
          <Switch
            checked={permissions.can_edit_settings}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_edit_settings', v)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Manage Admins</Label>
          <Switch
            checked={permissions.can_manage_admins}
            onCheckedChange={(v) => updatePermission(form, setForm, 'can_manage_admins', v)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Assistant Admins</h2>
          <p className="text-gray-600">Manage assistant administrators with custom permissions</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAdmins} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setCreateDialogOpen(true)} className="bg-indigo-600">
            <Plus className="w-4 h-4 mr-2" />
            New Assistant Admin
          </Button>
        </div>
      </div>

      {/* Admins List */}
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : admins.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No assistant admins yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {admins.map((admin) => (
            <Card key={admin.id}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{admin.name}</h3>
                    <p className="text-sm text-gray-600">{admin.email}</p>
                    <div className="flex gap-2 mt-2">
                      <span className={`text-xs px-2 py-1 rounded ${admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                        Assistant Admin
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleEditAdmin(admin)} size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => handleDeleteAdmin(admin.id)} size="sm" variant="outline" className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Assistant Admin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input
                  value={createForm.name}
                  onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>
              <div className="col-span-2">
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                  placeholder="Strong password"
                />
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-4">Permissions</h4>
              <PermissionToggles 
                permissions={createForm.permissions}
                setPermissions={(p) => setCreateForm({...createForm, permissions: p})}
                form={createForm}
                setForm={setCreateForm}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAdmin} className="bg-indigo-600">Create Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Assistant Admin</DialogTitle>
          </DialogHeader>
          {selectedAdmin && (
            <div className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Account Active</Label>
                <Switch
                  checked={editForm.is_active}
                  onCheckedChange={(v) => setEditForm({...editForm, is_active: v})}
                />
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-4">Permissions</h4>
                <PermissionToggles 
                  permissions={editForm.permissions}
                  setPermissions={(p) => setEditForm({...editForm, permissions: p})}
                  form={editForm}
                  setForm={setEditForm}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateAdmin} className="bg-indigo-600">Update Admin</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssistantAdminPage;
