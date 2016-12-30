$(document).ready(function(){
    var tiempo = {
        hora: 0,
        minuto: 0,
        segundo: 0
    };

    var tiempo_corriendo = null;

    $(document).on("click", "#btn-comenzar", function(){
        alert("");
        if ($(this).text() == 'Tomar')
        {
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
                
                var hora = tiempo.hora < 10 ? '0' + tiempo.hora : tiempo.hora;
                var minuto = tiempo.minuto < 10 ? '0' + tiempo.minuto : tiempo.minuto;
                var segundos = tiempo.segundo < 10 ? '0' + tiempo.segundo : tiempo.segundo;
                $("#noc").val(hora + ":" + minuto + ":"+ segundos);

            }, 1000);
        }
        
    })
});