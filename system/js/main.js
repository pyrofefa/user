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
        .when('/empezar', {
            templateUrl : 'vistas/empezar.html',
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
    
    /*Fin de aclaraciones */
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
    $scope.iniciar_sesion = function()
    {
        var caja=$scope.caja;
        var contra=$scope.password;
        $http({
            method:"post",
            url: "http://agua.dev/user/iniciar",
            data: ({'name' : caja , 'password' :  contra })
        }).success(function(data){
            console.log(data);
            if(data==1)
            {
                window.location.href="#/empezar";
                localStorage.caja = caja;
                //console.log("Local storage: "+localStorage.caja);
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
rutas.controller('empezarController', function($scope, $http, $route, socket){

    $http({
        method:"get",
        url: "http://agua.dev/home/mostrar"
        }).success(function(data){
            $scope.datos=data;
            console.log(data);
        }).error(function(data){
            alert("Ha ocurrido un error al mostrar los datos");
    });

    $scope.tomar_turno=function($id, $turno)
    {

        socket.emit('caja', localStorage.caja);
        socket.emit('turno',$turno);
        
        $http({
            method:"put",
            url: "http://agua.dev/tikets/actualizar/"+$id,
            data: ({ 'estado' : 1, 'fk_caja' : localStorage.caja})
        }).success(function(data){
            //console.log(data);
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
    $scope.turno_abandonado = function($id, $turno)
    {
        $http({
            method:"put",
            url: "http://agua.dev/tikets/actualizar/"+$id,
            data: ({ 'estado' : 2, 'fk_caja' : localStorage.caja})
        }).success(function(data){
            //console.log(data);
            $route.reload();
        }).error(function(data){
            //console.log(data);
            alert("Ha ocurrido un error al actualizar los datos");
            $route.reload();
            //console.log(id);
        })
    };
    $scope.terminar = function($id, $turno)
    {
        
        var tiempo = $("#noc").val();

        console.log(tiempo);

        $http({
            method:"put",
            url: "http://agua.dev/tikets/actualizar/"+$id,
            data: ({ 'tiempo' : tiempo})
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
    $scope.refresh = function()
    {
        $route.reload();
    }    
});