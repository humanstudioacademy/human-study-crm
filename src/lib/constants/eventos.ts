import { Users, Phone, Mail, MapPin, CalendarPlus } from "lucide-react";

export const tipoEventoLabel: Record<string, string> = {
  reuniao: "Reunião",
  ligacao: "Ligação",
  email: "Atendimento por e-mail",
  visita: "Visita presencial",
  outro: "Outro",
};

export const tipoEventoIcon: Record<string, typeof Users> = {
  reuniao: Users,
  ligacao: Phone,
  email: Mail,
  visita: MapPin,
  outro: CalendarPlus,
};
