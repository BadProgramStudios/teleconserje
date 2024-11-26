import { Component, inject, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import html2canvas from 'html2canvas';
import { Directory, Filesystem, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { LoadingController, Platform } from '@ionic/angular';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
})
export class FolderPage implements OnInit, OnDestroy {
  
  public folder!: string;
  private activatedRoute = inject(ActivatedRoute);
  segment = "misDatos";
  miQr:string = "0000";

  form: FormGroup;
  horas: number[] = Array.from({ length: 24 }, (_, i) => i + 1); // Genera opciones de 1 a 24 horas
  
  @ViewChild('popover') popover: any | undefined;
  @ViewChild('content') content:any | undefined;

  isOpen = false;

  contador: number = 30; // Inicializamos el contador en 30 segundos
  intervalo: any; // Variable para almacenar el setInterval y detenerlo cuando sea necesario
  today: Date = new Date();  // Asignamos la fecha actual

  formVisita:any[] = [];


  constructor(private fb: FormBuilder, private loadingController: LoadingController, private platform: Platform) {
    this.form = this.fb.group({
      tipoDocumento: ['', Validators.required],
      documento: ['', [Validators.required, validarRut]], // Aplicamos la validación de RUT
      nombreCompleto: ['', Validators.required],
      unidad: ['', Validators.required],
      fechaHora: ['', Validators.required],
      estacionamiento: [''],
      patente: [''],
      cantidadHoras: [1],
      comentario: [''],
      codigoUnico: ['']
    });
  }

  jsonValue(item: any) {
    return JSON.stringify(item);  // Convierte el objeto a una cadena JSON
  }
  
  captureScreen(){
    const element = document.getElementById('qrImage') as HTMLElement;
   
    html2canvas(element).then((canvas:HTMLCanvasElement) => {
      //this.downloadImage(canvas);
      if(this.platform.is('capacitor')){
        this.compartir(canvas);
      } else { 
        this.downloadImage(canvas);
      }
    })
  }

  downloadImage(canvas: HTMLCanvasElement){
    const link = document.createElement('a');
    link.href = canvas.toDataURL();
    link.download = "qrTeleconserje.png";
    link.click();
  }

  async compartir(canvas: HTMLCanvasElement){

    let base64 = canvas.toDataURL();
    let path = "qrTeleconserje.png";

      const loading = await this.loadingController.create({spinner: 'crescent'});
      await loading.present();


      await Filesystem.writeFile({
        path: path,
        data: base64,
        directory: Directory.Cache,
      }).then(async (res) => {
        let uri = res.uri;

        await Share.share({url: 'ire'});

        await Filesystem.deleteFile({
          path,
          directory: Directory.Cache
        })
      }).finally(()=>{
        loading.dismiss();
      });

  }
  

  ngOnInit() {
    this.folder = this.activatedRoute.snapshot.paramMap.get('id') as string;
  }

    // Función para iniciar el contador
    iniciarContador() {
      // Iniciar el setInterval
      this.intervalo = setInterval(() => {
        if (this.contador > 0) {
          this.contador--; // Restamos 1 al contador cada segundo
        } else {
          this.contador = 30; // Reiniciamos el contador a 30 segundos cuando llegue a 0
        }
      }, 1000); // Se ejecuta cada segundo (1000 ms)
    }
  
    // Función para detener el contador
    detenerContador() {
      if (this.intervalo) {
        clearInterval(this.intervalo); // Detenemos el contador
      }
    }
  
    // Asegurarse de que el contador se detenga cuando el componente sea destruido
    ngOnDestroy() {
      this.detenerContador();
    }
    
  presentPopover(e: Event) {
    this.detenerContador();
    this.popover.event = e;
    this.isOpen = true;
    this.iniciarContador();
    this.miQr = String(this.generarCodigoUnico());
  }

  onSubmit() {
    if (this.form.valid) {
      const codigo = this.generarCodigoUnico();
      this.form.get('codigoUnico')?.setValue(codigo);

      console.log('Formulario enviado:', this.form.value);
      this.formVisita.push(this.form.value);
      console.log('Formulario guardado:', this.formVisita);
      this.segment = 'qr';
      this.content.scrollToTop();

    } else {
      console.log('Formulario inválido');
    }
  }

  generarCodigoUnico() {
    return Math.floor(1000 + Math.random() * 9000);
  }

  }

// Definición de la función validarRut como función flecha fuera de la clase
const validarRut = (control: AbstractControl): ValidationErrors | null => {
  const rut = control.value;
  if (!rut) return null;

  // Eliminar puntos y guion del RUT
  const rutLimpio = rut.replace(/^0+|[^0-9kK]+/g, '').toUpperCase();
  
  // Validar formato mínimo
  if (rutLimpio.length < 8) return { rutInvalido: true };

  const cuerpo = rutLimpio.slice(0, -1);
  const digitoVerificador = rutLimpio.slice(-1);
  
  // Calcular el dígito verificador
  let suma = 0;
  let multiplicador = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += +cuerpo[i] * multiplicador;
    multiplicador = multiplicador < 7 ? multiplicador + 1 : 2;
  }

  const dvEsperado = 11 - (suma % 11);
  const dv = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();

  return dv === digitoVerificador ? null : { rutInvalido: true };
};