//var socket = io.connect('http://localhost:8080', { 'forceNew': true });
var hora;
var minuto;
var segundos;

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
    socket.on('turno',function(data){
        console.log(data);
        $scope.$apply(function(){
            $scope.turno = data;
        });
    })
    socket.on('caja',function(data){
        console.log(data);
        $scope.$apply(function(){
            $scope.caja = data;
        });
    })
    socket.on('asunto',function(data){
        console.log(data);
        $scope.$apply(function(){
            $scope.asunto = data;
        });
    })

    $scope.iniciar_sesion = function()
    {
        var caja=$scope.caja;
        var contra=$scope.password;
        var sucursal=$scope.sucursal;
        console.log(sucursal);
        $http({
            method:"post",
            url: "http://localhost/turnomatic/public/user/iniciar/"+sucursal,
            //url: "http://192.168.1.57:8080/turnomatic/public/user/iniciar/"+sucursal,
            data: ({'name' : caja , 'password' :  contra })
        }).success(function(data){
            //console.log(data);
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
                console.log("error");
            }
        }).error(function(data){
            alert("Ha ocurrido un error al Iniciar Sesion");
            //console.log(data);
        })
    }

});
rutas.controller('pagosController', function($scope, $http, $route, socket){
    
    $scope.abandonado = true;
    $scope.terminar = true;
    $scope.mostrar = "Turno en espera"

    $http({
        method:"get",
        //url: "http://192.168.1.57:8080/turnomatic/public/home/mostrarpagos/"+localStorage.sucursal
        url: "http://localhost/turnomatic/public/home/mostrarpagos/"+localStorage.sucursal
        }).success(function(data){
            console.log(data.turno);
            $scope.datos=data;
        }).error(function(data){
            alert("Ha ocurrido un error al mostrar los datos");
    });

    $scope.tomar_turno=function($id, $turno, $subasunto)
    {
        //alert("haz hecho click  id:"+ $id+" turno: "+$turno);

        socket.emit('caja', localStorage.caja);
        socket.emit('turno',"P"+$turno);
        socket.emit('tipo','CAJA')

        $scope.tomar=true;
        $scope.volver=true;

        $http({
            method:"put",
            //url: "http://192.168.1.57:8080/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            data: ({ 'id_sucursal' : localStorage.sucursal, 'estado' : 1, 'fk_caja' : localStorage.caja})
        }).success(function(data){
            //console.log(data);
            $scope.tomar = true;
            $scope.abandonado = false;
            $scope.terminar = false;
            $scope.mostrar = "Atendiendo"
            //$route.reload();
        }).error(function(data){
            //console.log(data);
            alert("Ha ocurrido un error al actualizar los datos");
            //$route.reload();
            //console.log(id);
        })

         var tiempo = {
            hora: 0,
            minuto: 0,
            segundo: 0
        };

        var tiempo_corriendo = null;
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
        //alert("Terminado");
        var tiempo = $("#noc").val();
        console.log(tiempo);

        $http({
            method:"put",
            //url: "http://192.168.1.57:8080/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            data: ({ 'tiempo' : tiempo})
        }).success(function(data){
            //console.log(data);
            $route.reload();
        }).error(function(data){
            //console.log(data);
            alert("Ha ocurrido un error al actualizar los datos");
            //$route.reload();
            //console.log(id);
        })
    }
    $scope.turno_abandonado = function($id, $turno)
    {
        //alert("Abandonado");
        var tiempo = $("#noc").val();
        console.log(tiempo);
        
        $http({
            method:"put",
            //url: "http://192.168.1.57:8080/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            data: ({ 'estado' : 2, 'fk_caja' : localStorage.caja,'tiempo' : tiempo })
        }).success(function(data){
            //console.log(data);
            $route.reload();
        }).error(function(data){
            //console.log(data);
            alert("Ha ocurrido un error al actualizar los datos");
            $route.reload();
            //console.log(id);
        })
    }
    $scope.volver_atras = function()
    {
        window.location.href = "#/seleccionar";
    }
});
rutas.controller('aclaracionesController', function($scope, $http, $route, socket){
    
    $scope.abandonado = true;
    $scope.terminar = true;
    $scope.mostrar = "Turno en espera"

    $http({
        method:"get",
        //url: "http://192.168.1.57:8080/turnomatic/public/home/mostraraclaraciones/"+localStorage.sucursal
        url: "http://localhost/turnomatic/public/home/mostraraclaraciones/"+localStorage.sucursal
        }).success(function(data){
            $scope.datos=data;
            console.log(data);
        }).error(function(data){
            alert("Ha ocurrido un error al mostrar los datos");
    });

    $scope.tomar_turno=function($id, $turno, $subasunto, $letra)
    {
        //alert("haz hecho click  id:"+ $id+" turno: "+$turno);
        var numero = $letra+$turno;
        //console.log(numero);
        socket.emit('caja', localStorage.caja);
        socket.emit('turno',numero);
        socket.emit('tipo','VENTANILLA');

        $scope.tomar=true;
        $scope.volver = true;

        $http({
            method:"put",
            //url: "http://192.168.1.57:8080/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            data: ({ 'estado' : 1, 'fk_caja' : localStorage.caja})
        }).success(function(data){
            //console.log(data);
            $scope.tomar = true;
            $scope.abandonado = false;
            $scope.terminar = false;
            $scope.mostrar = "Atendiendo"
            //$route.reload();
        }).error(function(data){
            //console.log(data);
            alert("Ha ocurrido un error al actualizar los datos");
            //$route.reload();
            //console.log(id);
        })

         var tiempo = {
            hora: 0,
            minuto: 0,
            segundo: 0
        };

        var tiempo_corriendo = null;
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
        //alert("Terminado");
        var tiempo = $("#noc").val();
       //console.log (tiempo);

        $http({
            method:"put",
            //url: "http://192.168.1.57:8080/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            data: ({ 'tiempo' : tiempo})
        }).success(function(data){
            //console.log(data);
            $route.reload();
        }).error(function(data){
            //console.log(data);
            alert("Ha ocurrido un error al actualizar los datos");
            //$route.reload();
            //console.log(id);
        })
    }
    $scope.turno_abandonado = function($id, $turno)
    {
        //alert("Abandonado");
        var tiempo = $("#noc").val();
        //console.log(tiempo);
        
        $http({
            method:"put",
            //url: "http://192.168.1.57:8080/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            data: ({ 'estado' : 2, 'fk_caja' : localStorage.caja,'tiempo' : tiempo })
        }).success(function(data){
            //console.log(data);
            $route.reload();
        }).error(function(data){
            //console.log(data);
            alert("Ha ocurrido un error al actualizar los datos");
            $route.reload();
            //console.log(id);
        })
    }
    $scope.volver_atras = function()
    {
        window.location.href = "#/seleccionar";
    }
});