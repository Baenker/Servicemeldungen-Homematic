# Servicemeldungen-Homematic
Servicemeldungen von Homematic-Geräten über ioBroker

Vor dem Starten des Scripts sollte man die Konfiguration einmal durchgucken und ggf. anpassungen machen.

Die Servicmeldungen können in einem Datenpunkt geschrieben werden. Möchte man nun die Liste der Servicemeldungen in vis untereinander haben, kann man einfach in vis ein html Feld anlegegen und dort als "Script" folgendes eintragen:

{a:Systemvariable.0.Servicemeldung;a.replace(/,/g,"xbry")}

Man muss natürlich statt "Systemvariable.0.Servicemeldung" seinen Datenpunkt eintragen. Und hinten statt bei "xbry" trägt man für das "x" ein "<" und für das "y" ein ">" ein. (Github wandelt leider die korrekte Zeichenfolge in ein Zeilenumbruch um)...
