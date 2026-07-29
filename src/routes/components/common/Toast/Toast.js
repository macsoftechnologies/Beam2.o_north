import Swal from "sweetalert2";

// Helper: style the close button on every toast
const styleCloseBtn = (popup) => {
  if (popup && popup.parentElement) {
    popup.parentElement.style.zIndex = "99999999";
  }
  const btn = popup.querySelector(".swal2-close");
  if (!btn) return;
  Object.assign(btn.style, {
    position: "absolute",
    top: "8px",
    right: "8px",
    width: "26px",
    height: "26px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#ffffff",
    fontSize: "16px",
    fontWeight: "700",
    background: "rgba(180, 30, 30, 0.75)",
    border: "1.5px solid rgba(255,255,255,0.25)",
    borderRadius: "6px",
    outline: "none",
    cursor: "pointer",
    lineHeight: "1",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
    transition: "background 0.2s ease, transform 0.15s ease",
    zIndex: "9999",
  });
  btn.onmouseenter = () => {
    btn.style.background = "rgba(220, 38, 38, 1)";
    btn.style.transform = "scale(1.1)";
  };
  btn.onmouseleave = () => {
    btn.style.background = "rgba(180, 30, 30, 0.75)";
    btn.style.transform = "scale(1)";
  };
};

// SUCCESS TOAST
export const showSuccess = (
  message = "Success",
  bgColor = "#22c55e"
) => {
  Swal.fire({
    title: "Success!",
    text: message,
    icon: "success",
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    showCloseButton: true,
    timer: 5000,
    timerProgressBar: true,
    background: bgColor,
    color: "#ffffff",
    didOpen: (popup) => styleCloseBtn(popup),
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
    showCloseButton: true,
    timer: 5000,
    timerProgressBar: true,
    background: "#ef4444",
    color: "#ffffff",
    didOpen: (popup) => styleCloseBtn(popup),
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
    showCloseButton: true,
    timer: 5000,
    timerProgressBar: true,
    background: "#8f1e1e",
    color: "#ffffff",
    didOpen: (popup) => styleCloseBtn(popup),
  });
};