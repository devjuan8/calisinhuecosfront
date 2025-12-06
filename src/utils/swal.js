import Swal from 'sweetalert2';

export const showSuccess = (message, title = '¡Éxito!') => {
  return Swal.fire({
    icon: 'success',
    title: title,
    text: message,
    confirmButtonColor: '#007bff',
    confirmButtonText: 'Aceptar',
  });
};

export const showError = (message, title = 'Error') => {
  return Swal.fire({
    icon: 'error',
    title: title,
    text: message,
    confirmButtonColor: '#dc3545',
    confirmButtonText: 'Aceptar',
  });
};

export const showWarning = (message, title = 'Advertencia') => {
  return Swal.fire({
    icon: 'warning',
    title: title,
    text: message,
    confirmButtonColor: '#ffc107',
    confirmButtonText: 'Aceptar',
  });
};

export const showInfo = (message, title = 'Información') => {
  return Swal.fire({
    icon: 'info',
    title: title,
    text: message,
    confirmButtonColor: '#17a2b8',
    confirmButtonText: 'Aceptar',
  });
};

export const showConfirm = (message, title = 'Confirmar') => {
  return Swal.fire({
    title: title,
    text: message,
    icon: 'question',
    showCancelButton: true,
    confirmButtonColor: '#007bff',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí',
    cancelButtonText: 'No',
  });
};

export const showPrompt = (message, title = 'Ingresar', placeholder = '') => {
  return Swal.fire({
    title: title,
    text: message,
    input: 'text',
    inputPlaceholder: placeholder,
    showCancelButton: true,
    confirmButtonColor: '#007bff',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Aceptar',
    cancelButtonText: 'Cancelar',
    inputValidator: (value) => {
      if (!value) {
        return 'Debes ingresar un valor';
      }
    },
  });
};

export default Swal;

