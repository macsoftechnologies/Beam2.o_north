import React, { useState, useEffect, useCallback } from "react";
import { showSuccess, showError, showDeleteConfirm, showDeleteSuccess } from "../../components/common/Toast/Toast";
import Table from "../../components/common/Table/Table";
import Modal from "../../components/common/Modal/Modal";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import EmployeeForm from "../../forms/Employeesform/Employeesform";
import { getEmployees, addEmployee, updateEmployee, deleteEmployee, getRoles } from "../../services/authService";
import "../styles/pages.css";

const PAGE_LIMIT_DEFAULT = 10;

const ActionButtons = ({ onView, onEdit, onDelete }) => (
  <div className="dept-action-btns">
    <button className="dept-action-btn dept-action-btn--view" title="View" onClick={onView}>
      <FaEye />
    </button>
    <button className="dept-action-btn dept-action-btn--edit" title="Edit" onClick={onEdit}>
      <FaEdit />
    </button>
    <button className="dept-action-btn dept-action-btn--delete" title="Delete" onClick={onDelete}>
      <FaTrash />
    </button>
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`dept-status-badge dept-status-badge--${status ? "active" : "inactive"}`}>
    {status ? "● Active" : "● Inactive"}
  </span>
);

const EMPLOYEE_TYPE_LABELS = {
  "Department": "ConM/HSE",
  "Department1": "C&Q",
  "Subcontractor": "Contractor",
  "Observer": "Observer"
};

const Employees = () => {
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeList, setEmployeeList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit] = useState(PAGE_LIMIT_DEFAULT);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [rolesList, setRolesList] = useState([]);

  // Fetch roles
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await getRoles(1, 100);
        const rows = res?.data?.rows ?? res?.data ?? res ?? [];
        setRolesList(rows);
      } catch (err) {
        console.error("Failed to load roles", err);
      }
    };
    fetchRoles();
  }, []);

  // Fetch employees
  const fetchEmployees = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const res = await getEmployees(page, pageLimit);
      const rows = res?.data?.rows ?? res?.data ?? res ?? [];
      const count = res?.data?.count ?? res?.total ?? rows.length;
      setEmployeeList(rows);
      setTotalCount(count);
    } catch {
      showError("Failed to load employees");
    } finally {
      setIsLoading(false);
    }
  }, [pageLimit]);

  useEffect(() => {
    fetchEmployees(currentPage);
  }, [currentPage, fetchEmployees]);

  const handleView = (item, index) => {
    setSelectedEmployee({ ...item, serial: startIndex + index + 1 });
    setViewOpen(true);
  };

  const handleEdit = (item, index) => {
    setSelectedEmployee({ ...item, serial: startIndex + index + 1 });
    setEditOpen(true);
  };

  const handleDelete = async (item) => {
    const result = await showDeleteConfirm();
    if (!result.isConfirmed) return;
    try {
      await deleteEmployee(item.id);
      showDeleteSuccess();
      const newPage = employeeList.length === 1 && currentPage > 1
        ? currentPage - 1
        : currentPage;
      setCurrentPage(newPage);
      fetchEmployees(newPage);
    } catch {
      showError("Failed to delete employee");
    }
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedEmployee && editOpen) {
        await updateEmployee(formData);
        showSuccess("Employee updated successfully");
        setEditOpen(false);
        setSelectedEmployee(null);
      } else {
        await addEmployee(formData);
        showSuccess("Employee added successfully");
        setOpen(false);
      }
      fetchEmployees(currentPage);
    } catch {
      showError("Operation failed");
    }
  };

  const totalPages = Math.ceil((totalCount || employeeList.length) / pageLimit);
  const startIndex = (currentPage - 1) * pageLimit;

  const columns = [
    { header: "S.No", accessor: "serial" },
    { header: "Employee Name", accessor: "name" },
    { header: "Badge Id", accessor: "badgeId" },
    { header: "Designation", accessor: "designation" },
    { header: "Company Name", accessor: "companyName" },
    { header: "Email ID", accessor: "email" },
    { header: "Phonenumber", accessor: "phoneNumber" },
    { header: "Actions", accessor: "actions" },
  ];

  const tableData = employeeList.map((item, index) => ({
    ...item,
    serial: startIndex + index + 1,
    name: item.employeeName,
    phoneNumber: item.phonenumber,
    actions: (
      <ActionButtons
        onView={() => handleView(item, index)}
        onEdit={() => handleEdit(item, index)}
        onDelete={() => handleDelete(item)}
      />
    ),
  }));

  return (
    <div className="dept-page">

      <div className="dept-page-header">
        <div className="dept-page-header__left">
          <h1 className="dept-page-title">Employees</h1>
          <p className="dept-page-subtitle">Manage and configure all employee records</p>
        </div>
        <div className="dept-page-header__right">
          <span className="dept-count-badge">{(totalCount || employeeList.length)} Total</span>
          <button className="dept-add-btn" onClick={() => { setSelectedEmployee(null); setOpen(true); }}>
            <span className="dept-add-btn__icon">＋</span>
            Add Employee
          </button>
        </div>
      </div>

      <div className="dept-table-card">
        <Table
          columns={columns}
          data={tableData}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          isLoading={isLoading}
        />
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Employee" size="xl" type="default" scrollable>
        <EmployeeForm onClose={() => setOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Employee" size="xl" type="warning" scrollable>
        <EmployeeForm isEdit initialData={selectedEmployee} onClose={() => setEditOpen(false)} onSubmit={handleSubmit} />
      </Modal>

      <Modal open={viewOpen} onClose={() => setViewOpen(false)} title="Employee Details" size="md" type="info" scrollable>
        {selectedEmployee && (
          <div className="dept-view-grid">
            <div className="dept-view-item">
              <span className="dept-view-label">Employee Name</span>
              <span className="dept-view-value">{selectedEmployee.employeeName}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Badge Id</span>
              <span className="dept-view-value dept-view-value--code">{selectedEmployee.badgeId || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Designation</span>
              <span className="dept-view-value">{selectedEmployee.designation || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Phone Number</span>
              <span className="dept-view-value">{selectedEmployee.phonenumber || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Role</span>
              <span className="dept-view-value dept-view-value--code">
                {rolesList.find(r => Number(r.id) === Number(selectedEmployee.roleId))?.roleName || (selectedEmployee.roleId === 0 ? "Admin" : selectedEmployee.role || "—")}
              </span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Employee Type</span>
              <span className="dept-view-value">
                {EMPLOYEE_TYPE_LABELS[selectedEmployee.userType] || selectedEmployee.userType || "—"}
              </span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Company Name</span>
              <span className="dept-view-value">{selectedEmployee.companyName || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Access</span>
              <StatusBadge status={selectedEmployee.access === "1" || selectedEmployee.access === true} />
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Email</span>
              <span className="dept-view-value">{selectedEmployee.email || "—"}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Username</span>
              <span className="dept-view-value dept-view-value--code">{selectedEmployee.username}</span>
            </div>
            <div className="dept-view-item">
              <span className="dept-view-label">Serial No.</span>
              <span className="dept-view-value">#{selectedEmployee.serial}</span>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
};

export default Employees;