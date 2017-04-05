//var socket = io.connect('http://localhost:8080', { 'forceNew': true });
var hora;
var minuto;
var segundos;
var tiempo_corriendo = null;



var noActivity = 0;
var flag = false;
var idleInterval;

// Creación del módulo
var rutas = angular.module('rutas', ['ngRoute','ngResource']);
// Configuración de las rutas
rutas.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl : 'vistas/inicio.html',
            controller  : 'inicioController'
        })
        .when('/seleccionar', {
            templateUrl : 'vistas/seleccionar.html'
        })
        .when('/seleccionar/pagos',{
            templateUrl : 'vistas/pagos.html',
            controller  : 'pagosController'  
        })
        .when('/seleccionar/aclaraciones',{
            templateUrl : 'vistas/aclaraciones.html',
            controller  : 'aclaracionesController'  
        })
        .when('/empezar', {
            templateUrl : 'vistas/pagos.html',
            controller  : 'empezarController'
        })
        /*final*/  
        .otherwise({
            redirectTo: '/'
        });
});

//lamando a socket en angular
rutas.factory('socket',['$rootScope', function($rootScope){
    var socket = io.connect('http://localhost:8080');
    return{
        on: function(eventName, callback){
            socket.on(eventName, callback);
        },
        emit:function(eventName,data){
            socket.emit(eventName,data);
        }
    };
}]);
//controlador 
rutas.controller('inicioController', function($scope, $http, $route, socket) 
{
    $scope.tipo="Ventanilla";

    socket.on('turno',function(data){
        //console.log(data);
        $scope.$apply(function(){
            $scope.turno = data;
        });
    })
    socket.on('caja',function(data){
       // console.log(data);
        $scope.$apply(function(){
            $scope.caja = data;
        });
    })
    socket.on('tipo',function(data){
        //console.log(data);
        $scope.$apply(function(){
            $scope.tipo = data;
        });
    })
    $scope.iniciar_sesion = function()
    {
        $('#cargando').show();
        var caja=$scope.caja;
        var contra=$scope.password;
        var sucursal=$scope.sucursal;
        //console.log(sucursal);
        $http({
            method:"post",
            url: "http://localhost/turnomatic/public/api/iniciar/"+sucursal,
            //url: "http://localhost/turnomatic/public/user/iniciar/"+sucursal,
            data: ({'name' : caja , 'password' :  contra })
        }).success(function(data){
            //console.log(data);
            $("#cargando").hide();
            if(data==1)
            {
                window.location.href="#/seleccionar";
                localStorage.caja = caja;
                document.getElementById("caja").innerHTML = localStorage.caja;
                localStorage.sucursal= sucursal;
                console.log("Local storage caja: "+localStorage.caja);
                console.log("Local storage caja: "+localStorage.sucursal);
            }
            else if(data==0)
            {
                //console.log("error");
                $("#error").show();
            }
        }).error(function(data){
            //alert("Ha ocurrido un error al Iniciar Sesion");
            $("#error_servidor").show();
            $("#cargando").hide();
            //console.log(data);
        })
    }

});
rutas.controller('pagosController', function($scope, $http, $route, socket, $timeout)
{
    $scope.abandonado = true;
    $scope.terminar = true;
    $scope.mostrar = "Turno en espera"
   
    $http({
        method:"get",
        //url: "http://localhost/turnomatic/public/home/mostrarpagos/"+localStorage.sucursal
        url: "http://localhost/turnomatic/public/api/mostrarpagos/"+localStorage.sucursal
        }).success(function(data){
            //console.log(data.turno);
            $('#cargando').hide();
            $scope.datos=data;
        }).error(function(data){
            //alert("Ha ocurrido un error al mostrar los datos");
            $route.reload();
    });
    $scope.tomar_turno=function($id, $turno, $subasunto)
    {
        var datetimeNow = new Date();
        var hourNow = datetimeNow.getHours();
        var minuteNow = datetimeNow.getMinutes();
        var secondsNow = datetimeNow.getSeconds();
        var atendido = hourNow+':'+minuteNow+':'+secondsNow;
        //console.log(atendido);
        
        clearInterval(idleInterval);
        noActivity = 0;
        //alert("haz hecho click  id:"+ $id+" turno: "+$turno);
        $('#cargando').show();
        socket.emit('caja', localStorage.caja);
        socket.emit('turno',"P"+$turno);
        socket.emit('tipo','CAJA')
        $scope.tomar=true;
        $scope.volver=true;
        
        $http({
            method:"put",
            //url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/api/tikets/actualizar/"+$id,
            data: ({ 'id_sucursal' : localStorage.sucursal, 'estado' : 1, 'fk_caja' : localStorage.caja, 'atendido' : atendido })
        }).success(function(data){
            //console.log(data);
            $scope.tomar = true;
            $scope.abandonado = false;
            $scope.terminar = false;
            $scope.mostrar = "Atendiendo"
            flag = false;
            $('#cargando').hide();
            //$route.reload();
        }).error(function(data){
            //console.log(data);
            //alert("Ha ocurrido un error al actualizar los datos");
            $('#cargando').show();
            $route.reload();
            //console.log(id);
        })
        var tiempo = {
            hora: 0,
            minuto: 0,
            segundo: 0
        };
        tiempo_corriendo = setInterval(function()
        {
            // Segundos
            tiempo.segundo++;
            if(tiempo.segundo >= 60)
            {
                tiempo.segundo = 0;
                tiempo.minuto++;
            }      
            // Minutos
            if(tiempo.minuto >= 60)
            {
                tiempo.minuto = 0;
                tiempo.hora++;
            }
            hora = tiempo.hora < 10 ? '0' + tiempo.hora : tiempo.hora;
            minuto = tiempo.minuto < 10 ? '0' + tiempo.minuto : tiempo.minuto;
            segundos = tiempo.segundo < 10 ? '0' + tiempo.segundo : tiempo.segundo;
            $("#noc").val(hora + ":" + minuto + ":"+ segundos);

        }, 1000);

    }
    $scope.terminar_turno = function($id, $turno)
    {
        
        $('#cargando').show();
        //alert("Terminado");
        var tiempo = $("#noc").val();
        //console.log(tiempo);
        $http({
            method:"put",
            //url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/api/tikets/actualizar/"+$id,
            data: ({ 'tiempo' : tiempo})
        }).success(function(data){
            clearInterval(tiempo_corriendo);
            $('#cargando').hide();
            $route.reload();
            flag = true;
        }).error(function(data){
            clearInterval(tiempo_corriendo);
            $('#cargando').show();
            $route.reload();
            //console.log(id);
        })

        idleInterval = setInterval(timerIncrement, 1000); // 1 segundo
    }
    $scope.turno_abandonado = function($id, $turno)
    {
        $('#cargando').show();
        //alert("Abandonado");
        var tiempo = $("#noc").val();
        //console.log(tiempo);
        $http({
            method:"put",
            //url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/api/tikets/actualizar/"+$id,
            data: ({ 'estado' : 2, 'fk_caja' : localStorage.caja,'tiempo' : tiempo })
        }).success(function(data){
            clearInterval(tiempo_corriendo);
            $('#cargando').hide();
            $route.reload();
        }).error(function(data){
            clearInterval(tiempo_corriendo);
            $('#cargando').show();
            $route.reload();
        })
        idleInterval = setInterval(timerIncrement, 1000); // 1 segundo
    }
    $scope.volver_atras = function()
    {
        window.location.href = "#/seleccionar";
        clearInterval(idleInterval);
        noActivity = 0;
    }
});
rutas.controller('aclaracionesController', function($scope, $http, $route, socket){
    
    $scope.abandonado = true;
    $scope.terminar = true;
    $scope.mostrar = "Turno en espera"
   
    $http({
        method:"get",
        //url: "http://localhost/turnomatic/public/home/mostraraclaraciones/"+localStorage.sucursal
        url: "http://localhost/turnomatic/public/api/mostraraclaraciones/"+localStorage.sucursal
        }).success(function(data){
            $scope.datos=data;
            $('#cargando').hide();
            //console.log(data);
        }).error(function(data){
            //alert("Ha ocurrido un error al mostrar los datos");
    });
    $scope.tomar_turno=function($id, $turno, $subasunto, $letra)
    {

        var datetimeNow = new Date();
        var hourNow = datetimeNow.getHours();
        var minuteNow = datetimeNow.getMinutes();
        var secondsNow = datetimeNow.getSeconds();
        var atendido = hourNow+':'+minuteNow+':'+secondsNow;
        //console.log(atendido);
        
        clearInterval(idleInterval);

        noActivity = 0;
        //alert("haz hecho click  id:"+ $id+" turno: "+$turno);
        $('#cargando').show();
        var numero = $letra+$turno;
        //console.log(numero);
        socket.emit('caja', localStorage.caja);
        socket.emit('turno',numero);
        socket.emit('tipo','VENTANILLA');

        $scope.tomar=true;
        $scope.volver = true;

        $http({
            method:"put",
            //url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/api/tikets/actualizar/"+$id,
            data: ({ 'estado' : 1, 'fk_caja' : localStorage.caja, 'atendido' : atendido })
        }).success(function(data){
            //console.log(data);
            $scope.tomar = true;
            $scope.abandonado = false;
            $scope.terminar = false;
            $scope.mostrar = "Atendiendo"
            $('#cargando').hide();
            //$route.reload();
        }).error(function(data){
            //console.log(data);
            //alert("Ha ocurrido un error al actualizar los datos");
            $('#cargando').show();
            $route.reload();
            //console.log(id);
        })
        var tiempo = {
            hora: 0,
            minuto: 0,
            segundo: 0
        };
        tiempo_corriendo = null;
        tiempo_corriendo = setInterval(function()
        {
            // Segundos
            tiempo.segundo++;
            if(tiempo.segundo >= 60)
            {
                tiempo.segundo = 0;
                tiempo.minuto++;
            }      
            // Minutos
            if(tiempo.minuto >= 60)
            {
                tiempo.minuto = 0;
                tiempo.hora++;
            }
            hora = tiempo.hora < 10 ? '0' + tiempo.hora : tiempo.hora;
            minuto = tiempo.minuto < 10 ? '0' + tiempo.minuto : tiempo.minuto;
            segundos = tiempo.segundo < 10 ? '0' + tiempo.segundo : tiempo.segundo;
            $("#noc").val(hora + ":" + minuto + ":"+ segundos);

        }, 1000);
    }
    $scope.terminar_turno = function($id, $turno)
    {
        $('#cargando').show();
        //alert("Terminado");
        var tiempo = $("#noc").val();
        //console.log (tiempo);
        $http({
            method:"put",
            //url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/api/tikets/actualizar/"+$id,
            data: ({ 'tiempo' : tiempo})
        }).success(function(data){
            //console.log(data);
            $('#cargando').hide();
            clearInterval(tiempo_corriendo);
            $route.reload();
        }).error(function(data){
            clearInterval(tiempo_corriendo);
            $('#cargando').show();
            $route.reload();
            //console.log(id);
        })
        idleInterval = setInterval(timerIncrement, 1000); // 1 segundo
        //Zero the idle timer on mouse movement.
    }
    $scope.turno_abandonado = function($id, $turno)
    {
        //alert("Abandonado");
        $('#cargando').show();
        var tiempo = $("#noc").val();
        //console.log(tiempo);
        $http({
            method:"put",
            //url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/api/tikets/actualizar/"+$id,
            data: ({ 'estado' : 2, 'fk_caja' : localStorage.caja,'tiempo' : tiempo })
        }).success(function(data){
            //console.log(data);
            clearInterval(tiempo_corriendo);
            $('#cargando').hide();
            $route.reload();
        }).error(function(data){
            clearInterval(tiempo_corriendo);
            $('#cargando').show();
            $route.reload();
            //console.log(id);
        })
        idleInterval = setInterval(timerIncrement, 1000); // 1 segundo
    }
    $scope.volver_atras = function()
    {
        window.location.href = "#/seleccionar";
        clearInterval(idleInterval);
        noActivity = 0;
    }
});

function timerIncrement() 
{

  noActivity = noActivity + 1;
  //console.log(flag);
  //console.log("noActivity: "+noActivity);
  
    if (noActivity > 130)
    {
        noActivity = 0;
        clearInterval(idleInterval);
        window.location = '#/seleccionar';
    }
}