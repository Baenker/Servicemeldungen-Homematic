# Servicemeldungen-Homematic
Servicemeldungen von Homematic-Geräten über ioBroker

Vor dem Starten des Scripts sollte man die Konfiguration einmal durchgucken und ggf. anpassungen machen.

var logging = true;             //Sollte eigentlich immer auf true stehen
var debugging = false;          // An Anfang macht es Sinn debugging auf true zu stellen und sich das Log anzugucken.

var autoAck = false;             //Löschen bestätigbarer Kommunikationsstörungen (true = an, false = aus) --> Allerdings derzeit ohne Funktion

var observation = true;        //Dauerhafte Überwachung der Geräte auf Servicemeldungen aktiv (true = aktiv // false =inaktiv)
var onetime = true;             //Prüft beim Script Start ob derzeit Geräte eine Servicemeldung haben

//pro Fehlertyp kann eine andere Prio genutzt werden
var prio_LOWBAT = 0;
var prio_UNREACH = 0;
var prio_STICKY_UNREACH = 0;
var prio_CONFIG_PENDING = 0;
var prio_UPDATE_PENDING = 0;
var prio_DEVICE_IN_BOOTLOADER = 0;
var prio_ERROR = 0;
var prio_ERROR_CODE = 0;
var prio_FAULT_REPORTING = 0;
var prio_SABOTAGE= 0;

<b>Derzeit noch ohne Funktion</b>
//Variablen für Servicemeldung in Objekt schreiben // Wenn einer Meldung auftritt wird diese in ein Textfeld geschrieben. Auf dieses kann man dann reagieren
//und z. B. die Nachricht per Telegram verschicken oder in vis anzeigen
var write_message = true;        // true schreibt beim auftreten einer Servicemeldung die Serviemeldung in ein Objekt
var id_Text_Servicemeldung = '';

//Variablen für Pushover
var sendpush = true;            //true = verschickt per Pushover Nachrchten // false = Pushover wird nicht benutzt
var _prio;
var _titel;
var _message;
var _device = 'TPhone';         //Welches Gerät soll die Nachricht bekommen
//var _device = 'All'; 

//Ergebnis in Datenfelder schreiben
var write_state = true;          //Schreibt die Ergebnisse der Servicemeldungen in Datenfelder. (true = schreiben, false, kein schreiben)
//nicht benutzte Felder einfach leer lassen --> var id_IST_XXX = '';
var id_IST_LOWBAT = 'Systemvariable.0.Servicemeldungen.Anzahl_LOWBAT'/*Anzahl LOWBAT*/;
var id_IST_LOW_BAT = '';
var id_IST_G_LOWBAT = '';
var id_IST_UNREACH = '';
var id_IST_STICKY_UNREACH = '';
var id_IST_CONFIG_PENDING = '';
var id_IST_UPDATE_PENDING = '';
var id_IST_DEVICE_IN_BOOTLOADER = '';
var id_IST_ERROR = '';
var id_IST_ERROR_CODE = '';
var id_IST_FAULT_REPORTING = '';
var id_IST_SABOTAGE = '';
var id_IST_Gesamt = '';

