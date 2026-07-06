import Swal from "sweetalert2";

// SUCCESS TOAST
export const showSuccess = (
  message = "Success",
  bgColor = "#28a745"
) => {
  Swal.fire({
    title: "Success!",
    text: message,
    icon: "success",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    background: bgColor,
    color: "#ffffff",
  });
};

// ERROR TOAST
export const showError = (
  message = "Something went wrong"
) => {
  Swal.fire({
    title: "Error",
    text: message,
    icon: "error",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    background: "#d33",
    color: "#ffffff",
  });
};

// DELETE CONFIRMATION
export const showDeleteConfirm = async (
  text = "This record will be deleted permanently!"
) => {
  return await Swal.fire({
    title: "Are you sure?",
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#8f1e1e",
    cancelButtonColor: "#6c757d",
  });
};

// DELETE SUCCESS TOAST
export const showDeleteSuccess = (
  message = "Deleted successfully"
) => {
  Swal.fire({
    title: "Deleted!",
    text: message,
    icon: "success",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    background: "#8f1e1e",
    color: "#ffffff",
  });
};