//var socket = io.connect('http://localhost:8080', { 'forceNew': true });
// Creación del módulo
var rutas = angular.module('rutas', ['ngRoute','ngResource']);
// Configuración de las rutas
rutas.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl : 'vistas/inicio.html',
            controller  : ''
        })
        .when('/seleccionar', {
            templateUrl : 'vistas/seleccionar.html',
            controller  : 'seleccionarController'  
        })
        .when('/seleccionar/pagos',{
            templateUrl : 'vistas/pagos.html',
            controller  : 'pagosController'  
        })
        .when('/seleccionar/aclaraciones',{
            templateUrl : 'vistas/aclaraciones.html',
            controller  : 'aclaracionesController'  
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
rutas.controller('inicioController', function($scope, $http, $route, socket, $location) 
{
    
    $scope.tipo="VENTANILLA";
    socket.on('turno',function(data){
        //console.log(data);
        $scope.$apply(function(){
            $scope.turno = data.turno;
            $scope.caja = data.caja;
            $scope.letra = data.letra;
            $scope.tipo = data.tipo;

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
                $location.path('/seleccionar');
                localStorage.caja = caja;
                document.getElementById("caja").innerHTML = localStorage.caja;
                localStorage.sucursal= sucursal;
                console.log("Local storage caja: "+localStorage.caja);
                console.log("Local storage sucursal: "+localStorage.sucursal);
            }
            else if(data==0)
            {
                $("#error").show();
            }
        }).error(function(data){
            $("#error_servidor").show();
            $("#cargando").hide();
        })
    }

});
rutas.controller('pagosController', function($scope, $http, $route, $location, socket, $timeout )
{
    $scope.abandonado = true;
    $scope.terminar = true;
    $scope.mostrar = "Turno en espera";
    var turno;
   
    $http({
        method:"get",
        //url: "http://localhost/turnomatic/public/home/mostraraclaraciones/"+localStorage.sucursal
        url: "http://localhost/turnomatic/public/api/mostrarpagos/"+localStorage.sucursal
        }).success(function(data){
            $scope.datos=data;
            $('#cargando').hide();
            //console.log(data);
        }).error(function(data){
            //alert("Ha ocurrido un error al mostrar los datos");
    });

    socket.on('turno',function(data)
    {
        //console.log(data);
        $scope.$apply(function(){
            console.log('El Turno: '+data.turno+' esta siendo atendido por la caja: '+data.caja);
            console.log('Mi caja es: '+localStorage.caja);
            console.log('Y estoy atendiendo el turno: '+turno);
            
            if (data.caja == localStorage.caja && data.turno == turno) 
            {
                console.log('Tu estas atendiendo este turno');
            }
            else
            {
                console.log('El turno: '+turno+' esta siendo atendido por la caja: '+data.caja);
                console.log('Tu no estas atendiendo este turno');
                $scope.tomar = true;
                $scope.mostrar = 'Atendiendo';
            }

        });
    });
    
    $scope.tomar_turno = function($id, $turno, $subasunto, $letra, $tipo)
    {
        $('#asunto').removeAttr('disabled');
        $('#asunto_aclaraciones').removeAttr('disabled');
        $('#cargando').show();
        turno = $turno;

        $http({
            method:"put",
            //url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/api/tikets/actualizar/"+$id,
            data: ({'fk_caja' : localStorage.caja })
        }).success(function(data){
            socket.emit('turno',{ turno: turno, caja: localStorage.caja, asunto: $subasunto, letra: $letra, tipo: $tipo });
            //console.log(data);
            $scope.tomar = true;
            $scope.abandonado = false;
            $scope.terminar = false;
            $scope.volver = true;
            $scope.mostrar = "Atendiendo";
            $('#cargando').hide();
        }).error(function(data){
            alert('Ocurrio un error al tomar el turno intente de nuevo');
            $('#cargando').hide();
            //console.log(id);
        })
    }
    
    $scope.terminar_turno = function($id, $turno, $subasunto, $letra, $tipo)
    {
        var asunto = $('#asunto').val();
        console.log(asunto);
        $('#cargando').show();
        
        if (asunto == 'Seleccione') 
        {
            alert('Tiene que seleccionar un asunto');
            $('#cargando').hide();
        }
        else
        {
            $http({
                method:"put",
                //url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
                url: "http://localhost/turnomatic/public/api/tikets/actualizartiempo/"+$id,
                data: ({ 'subasunto' : asunto, 'asunto' : 'Pago' })
            }).success(function(data){
                socket.emit('termino',{ turno: turno, caja: localStorage.caja, asunto: $subasunto, letra: $letra, tipo: $tipo });
                $('#cargando').hide();
                $route.reload();
                //$location.path('/seleccionar');
            }).error(function(data){
                alert('Ocurrio un error al actualizar los datos intente de nuevo');
                $('#cargando').hide();
                //console.log(id);
            })
        }
    }
    $scope.turno_abandonado = function($id, $turno, $subasunto, $letra, $tipo)
    {
        var asunto = $('#asunto').val();
        console.log(asunto);
        //alert("Abandonado");
        $('#cargando').show();
        
        /*if (asunto == 'Seleccione') 
        {
            alert('Tiene que seleccionar un asunto');
            $('#cargando').hide();
        }
        else
        {*/    
            $http({
                method:"put",
                //url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
                url: "http://localhost/turnomatic/public/api/tikets/actualizartiempoabandonado/"+$id,
                data: ({'asunto': asunto })
            }).success(function(data){
                socket.emit('abandono',{ turno: turno, caja: localStorage.caja, asunto: $subasunto, letra: $letra, tipo: $tipo });
                $('#cargando').hide();
                $route.reload();
            }).error(function(data){
                alert('Ocurrio un error al actualizar los datos intente de nuevo');
                $('#cargando').hide();
            })
        
        //}
    }
    $scope.volver_atras = function()
    {
        $location.path('/seleccionar');
    }

});
rutas.controller('aclaracionesController', function($scope, $http, $location, socket, $route)
{

    $scope.tipos = [ {value : 'Tramites', asunto :'Trámite' } ,{value : 'Aclaraciones y Otros', asunto : 'Aclaración'}];
    $scope.tramites = [
        {
            value : 'Contrato',
            asunto : 'Contrato'
        },
        {
            value : 'Convenio', 
            asunto : 'Convenio'
        },
        {
            value : 'Cambio de nombre', 
            asunto : 'Cambio de nombre'
        },
        {
            value : 'Carta de adeudo',
            asunto : 'Carta de no adeudo'
        },
        {
            value : 'Factibilidad', 
            asunto : 'Factibilidad de servicio'
        },
        {
            value : 'Solicitud de tarifa social',
            asunto : 'Solicitud de tarifa social'
        },
        {
            value : '2 o mas tramites', 
            asunto : '2 o mas tramites'
        },
        {
            value : 'Propuestas de pago', 
            asunto : 'Propuestas de pago'
        },
        {
            value : 'Baja por impago', 
            asunto : 'Baja por impago'
        }
    ];
    
    $scope.aclaraciones = [
        {
            value : 'Alto consumo (con y sin medidor)',
            asunto : 'Alto consumo (con y sin medidor)'
        },
        {
            value : 'Reconexión de servicio',
            asunto : 'Reconexion de servicio' 
        },
        {
            value : 'Error en lectura',
            asunto : 'Error en lectura'
        },
        {
            value : 'No toma lectura',
            asunto : 'No toma lectura'
        },
        {
            value : 'Cambio de tarifa',
            asunto : 'Cambio de tarifa'
        },
        {
            value : 'No entrega de recibo',
            asunto : 'No entrega recibo'
        },
        {
            value : 'Solicitud de medidor',
            asunto : 'Solicitud de medidor'
        },
        {
            value : 'Otros tramites',
            asunto : 'Otros Tramites'
        },
        {
            value : 'Alta estimacion de consumo',
            asunto : 'Alta estimacion de consumo'
        },
        {
            value : 'Propuestas de pago',
            asunto : 'Propuestas de pago'
        },
        {
            value : 'Aviso de incidencia',
            asunto : 'Aviso de incidencia'
        }
    ];

    $scope.abandonado = true;
    $scope.terminar = true;
    $scope.mostrar = "Turno en espera";
    var turno;

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
    socket.on('turno',function(data)
    {
        //console.log(data);
        $scope.$apply(function(){
            console.log('El Turno: '+data.turno+' esta siendo atendido por la caja: '+data.caja);
            console.log('Mi caja es: '+localStorage.caja);
            console.log('Y estoy atendiendo el turno: '+turno);
            
            if (data.caja == localStorage.caja && data.turno == turno) 
            {
                console.log('Tu estas atendiendo este turno');
            }
            else
            {
                console.log('El turno: '+turno+' esta siendo atendido por la caja: '+data.caja);
                console.log('Tu no estas atendiendo este turno');
                $scope.tomar = true;
                $scope.mostrar = 'Atendiendo';
            }

        });
    });
    
    $scope.tomar_turno = function($id, $turno, $letra, $tipo)
    {
        $('#seleccionar').removeAttr('disabled');
         $('#cargando').show();
        turno = $turno;

        $http({
            method:"put",
            //url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/api/tikets/actualizar/"+$id,
            data: ({'fk_caja' : localStorage.caja })
        }).success(function(data){
            socket.emit('turno',{ turno: turno, caja: localStorage.caja, letra: $letra, tipo: $tipo });
            //console.log(data);
            $scope.tomar = true;
            $scope.abandonado = false;
            $scope.terminar = false;
            $scope.volver = true;
            $scope.mostrar = "Atendiendo";
            $('#cargando').hide();
        }).error(function(data){
            alert('Ocurrio un error al tomar el turno intente de nuevo');
            $('#cargando').hide();
            //console.log(id);
        })
    }
    $scope.terminar_turno = function( $id, $turno, $letra, $tipo)
    {
        var asunto = $('#asunto').val();
        var subasunto = $('#subasunto').val();
 
        $('#cargando').show();
        
        if (asunto == '') 
        {
            alert('Tiene que seleccionar un asunto');
            $('#cargando').hide();
        }
        else if(subasunto == '')
        {
            alert('Tiene que seleccionar un subasunto');
            $('#cargando').hide();
        }
        else
        {
            $http({
                method:"put",
                //url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
                url: "http://localhost/turnomatic/public/api/tikets/actualizartiempo/"+$id,
                data: ({ 'asunto' : asunto, 'subasunto' : subasunto })
            }).success(function(data){
                socket.emit('termino',{ turno: turno, caja: localStorage.caja, asunto: asunto, subasunto: subasunto, letra: $letra, tipo: $tipo });
                $('#cargando').hide();
                $route.reload();
                //$location.path('/seleccionar');
            }).error(function(data){
                alert('Ocurrio un error al actualizar los datos intente de nuevo');
                $('#cargando').hide();
                //console.log(id);
            })
        }
      
        
    }
    $scope.turno_abandonado = function($id, $turno, $letra, $tipo)
    {
        var asunto = $('#asunto').val();
        console.log(asunto);
        //alert("Abandonado");
        $('#cargando').show();

        $http({
            method:"put",
            //url: "http://localhost/turnomatic/public/tikets/actualizar/"+$id,
            url: "http://localhost/turnomatic/public/api/tikets/actualizartiempoabandonado/"+$id,
            data: ({'asunto': asunto })
        }).success(function(data){
            socket.emit('abandono',{ turno: turno, caja: localStorage.caja, letra: $letra, tipo: $tipo });
            $('#cargando').hide();
            $route.reload();
        }).error(function(data){
            alert('Ocurrio un error al actualizar los datos intente de nuevo');
            $('#cargando').hide();
        })
        
    }
    $scope.volver_atras = function()
    {
        $location.path('/seleccionar');
    }

});
rutas.controller('seleccionarController', function($scope, $http, $route, socket) 
{
});