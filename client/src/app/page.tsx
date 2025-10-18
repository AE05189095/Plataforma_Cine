import { redirect } from "next/navigation";

// 🚀 Redirige automáticamente al cargar la página raíz "/"
export default function HomeRedirect() {
  redirect("/movies");
}
