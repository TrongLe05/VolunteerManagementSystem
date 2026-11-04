import { useMemo } from "react";

export const usePasswordStrength = (
  password: string,
  comfirmPassword?: string,
) => {
  return useMemo(() => {
    let score = 0;
    if (password.length >= 6) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    const config = [
      {
        label: "Yếu",
        textClass: "text-red-500",
        borderClass:
          "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30",
      },
      {
        label: "Yếu",
        textClass: "text-red-500",
        borderClass:
          "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30",
      },
      {
        label: "Trung bình",
        textClass: "text-amber-500",
        borderClass:
          "border-amber-500 focus-visible:border-amber-500 focus-visible:ring-amber-500/30",
      },
      {
        label: "Khá mạnh",
        textClass: "text-blue-500",
        borderClass:
          "border-blue-500 focus-visible:border-blue-500 focus-visible:ring-blue-500/30",
      },
      {
        label: "Rất mạnh",
        textClass: "text-emerald-500",
        borderClass:
          "border-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30",
      },
    ];

    const current = config[score];
    const isMatch =
      comfirmPassword !== undefined &&
      comfirmPassword.length > 0 &&
      password === comfirmPassword;

    const hasTypePassword = password.length > 0;

    return {
      score: hasTypePassword ? score : 0,
      labelPassword: hasTypePassword
        ? `Độ bảo mật: ${current.label}`
        : `Mật khẩu phải có ít nhất 6 ký tự.`,
      labelConfirmPassword:
        comfirmPassword && comfirmPassword.length > 0
          ? isMatch
            ? "Mật khẩu khớp"
            : "Mật khẩu không khớp"
          : "Vui lòng nhập lại mật khẩu.",
      textClass: hasTypePassword ? current.textClass : "",
      // Nếu chưa nhập gì thì trả về chuỗi rỗng để giữ màu viền mặc định
      passwordInputClass: hasTypePassword ? current.borderClass : "",
      confirmInputClass:
        comfirmPassword && comfirmPassword.length > 0
          ? isMatch
            ? "border-emerald-500 focus-visible:border-emerald-500 focus-visible:ring-emerald-500/30"
            : "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/30"
          : "",
      isMatch,
    };
  }, [password, comfirmPassword]);
};
