# Servicemeldungen-Homematic
Servicemeldungen von Homematic-Geräten über ioBroker

Vor dem Starten des Scripts sollte man die Konfiguration einmal durchgucken und ggf. anpassungen machen.

Die Servicmeldungen können in einem Datenpunkt geschrieben werden. Möchte man nun die Liste der Servicemeldungen in vis untereinander haben, kann man einfach in vis ein html Feld anlegegen und dort als "Script" folgendes eintragen:

{a:Systemvariable.0.Servicemeldung;a.replace(/,/g,"<br>")}

Man muss natürlich statt "Systemvariable.0.Servicemeldung" seinen Datenpunkt eintragen.
