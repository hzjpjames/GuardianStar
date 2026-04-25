Add-Type -AssemblyName System
$key = [System.Security.Cryptography.RSA.Create](2048)
$req = New-Object System.Security.Cryptography.X509Certificates.CertificateRequest(
    "CN=192.168.0.123",
    $key,
    [System.Security.Cryptography.HashAlgorithmName]::SHA256,
    [System.Security.Cryptography.RSASignaturePadding]::Pkcs1
)
$eku = New-Object System.Security.Cryptography.X509Certificates.OidCollection
$eku.Add((New-Object System.Security.Cryptography.X509Certificates.Oid("1.3.6.1.5.5.7.3.1")))
$ext = New-Object System.Security.Cryptography.X509Certificates.X509EnhancedKeyUsageExtension($eku, $false)
$req.CertificateExtensions.Add($ext)
$notBefore = [DateTimeOffset]::Now.AddDays(-1)
$notAfter = [DateTimeOffset]::Now.AddYears(10)
$cert = $req.CreateSelfSigned($notBefore, $notAfter)
$pwd = ConvertTo-SecureString -String "guardian123" -Force -AsPlainText
$outPath = "C:\Users\Administrator\.qclaw\workspace-agent-e87418f0\GuardianNew\server\cert.pfx"
Export-PfxCertificate -Cert $cert -FilePath $outPath -Password $pwd
Write-Host "Certificate created at $outPath"
$key.Dispose()
$cert.Dispose()
